# ==========================================
# LAMBDA 4: GET SUMMARY API
# File name: notebook-get-summary
# API Gateway Route: GET /getSummary/{notebookId}/{summaryType}
# Alternative Route: GET /getSummary/{notebookId} (gets all summaries)
# ==========================================

import json
import boto3
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import re

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Get Summary API Gateway Endpoint
    
    Routes:
    GET /getSummary/{notebookId} - Get all summaries for a notebook
    GET /getSummary/{notebookId}/{summaryType} - Get specific summary type
    
    Query Parameters:
    - format: json (default), html, plain
    - include_metadata: true/false
    
    Headers:
    - X-User-Email: Required for authentication
    """
    try:
        print("=== Get Summary API Lambda ===")
        print(f"Event: {json.dumps(event, default=str)}")
        
        # Extract path parameters
        path_params = event.get('pathParameters', {}) or {}
        notebook_id = path_params.get('notebookId')
        summary_type = path_params.get('summaryType')  # Optional
        
        # Extract query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        format_output = query_params.get('format', 'json').lower()
        include_metadata = query_params.get('include_metadata', 'true').lower() == 'true'
        
        # Get user email from headers
        headers = event.get('headers', {})
        user_email = get_user_email(event)
        
        # Validation
        if not notebook_id:
            return create_api_response(400, {
                'error': 'Missing notebookId',
                'message': 'notebookId is required in the URL path'
            })
        
        if not user_email:
            return create_api_response(401, {
                'error': 'Authentication required',
                'message': 'X-User-Email header is required'
            })
        
        # Validate format
        if format_output not in ['json', 'html', 'plain']:
            return create_api_response(400, {
                'error': 'Invalid format',
                'message': 'Format must be one of: json, html, plain'
            })
        
        print(f"✓ Getting summaries for notebook {notebook_id}, user {user_email}")
        print(f"✓ Summary type: {summary_type if summary_type else 'ALL'}")
        print(f"✓ Format: {format_output}")
        
        bucket = 'smart-notebook-media'  # Your S3 bucket
        
        # Check if specific summary type requested
        if summary_type:
            # Get specific summary
            summary_data = get_specific_summary(bucket, user_email, notebook_id, summary_type)
            if not summary_data:
                available_types = get_available_summary_types(bucket, user_email, notebook_id)
                return create_api_response(404, {
                    'error': 'Summary not found',
                    'message': f'Summary of type "{summary_type}" not found for this notebook',
                    'available_types': available_types,
                    'suggestion': f'Try one of: {", ".join(available_types)}' if available_types else 'No summaries available'
                })
            
            response_data = {
                'notebookId': notebook_id,
                'userEmail': user_email,
                'summaryType': summary_type,
                'summary': summary_data,
                'retrievedAt': datetime.now().isoformat()
            }
            
            # Format response based on requested format
            if format_output == 'html':
                return create_html_response(response_data, single_summary=True)
            elif format_output == 'plain':
                return create_plain_text_response(response_data, single_summary=True)
            else:
                return create_api_response(200, response_data)
        
        else:
            # Get all available summaries
            all_summaries = get_all_summaries(bucket, user_email, notebook_id, include_metadata)
            
            if not all_summaries['summaries']:
                return create_api_response(404, {
                    'error': 'No summaries found',
                    'message': 'No summaries have been created for this notebook yet',
                    'suggestion': 'Generate summaries first using POST /startSummary',
                    'notebookId': notebook_id
                })
            
            response_data = all_summaries
            response_data.update({
                'notebookId': notebook_id,
                'userEmail': user_email,
                'retrievedAt': datetime.now().isoformat()
            })
            
            # Format response based on requested format
            if format_output == 'html':
                return create_html_response(response_data, single_summary=False)
            elif format_output == 'plain':
                return create_plain_text_response(response_data, single_summary=False)
            else:
                return create_api_response(200, response_data)
        
    except Exception as e:
        print(f"❌ Error retrieving summaries: {str(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return create_api_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to retrieve summaries',
            'details': str(e)
        })


def get_user_email(event):
    """Extract user email from event headers"""
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    email = headers.get("x-user-email", "").strip().lower()
    return email if "@" in email else None


def get_specific_summary(bucket: str, email: str, notebook_id: str, summary_type: str) -> Optional[Dict]:
    """Retrieve a specific summary by type"""
    try:
        # Clean summary type name
        clean_summary_type = summary_type.lower().strip()
        
        # Try different possible filename formats
        possible_keys = [
            f"notebooks/{email}/{notebook_id}/summaries/{clean_summary_type}_summary.txt",
            f"notebooks/{email}/{notebook_id}/summaries/{summary_type}_summary.txt",
            f"notebooks/{email}/{notebook_id}/summaries/{clean_summary_type}.txt",
            f"notebooks/{email}/{notebook_id}/summaries/{summary_type}.txt"
        ]
        
        print(f"🔍 Looking for summary type '{summary_type}' in possible locations:")
        for key in possible_keys:
            print(f"   Trying: {key}")
            
        for key in possible_keys:
            try:
                response = s3_client.get_object(Bucket=bucket, Key=key)
                summary_content = response['Body'].read().decode('utf-8')
                
                # Get file metadata
                file_metadata = response.get('Metadata', {})
                last_modified = response['LastModified']
                content_length = response['ContentLength']
                
                print(f"✅ Found summary at: {key}")
                
                return {
                    'content': summary_content,
                    'type': clean_summary_type,
                    'filePath': key,
                    'fileSize': content_length,
                    'fileSizeFormatted': format_file_size(content_length),
                    'lastModified': last_modified.isoformat(),
                    'metadata': file_metadata,
                    'wordCount': len(summary_content.split()),
                    'characterCount': len(summary_content),
                    'estimatedReadingTime': f"{round(len(summary_content.split()) / 200, 1)} minutes",
                    'preview': summary_content[:300] + "..." if len(summary_content) > 300 else summary_content
                }
                
            except s3_client.exceptions.NoSuchKey:
                continue
            except Exception as e:
                print(f"⚠️ Error reading {key}: {str(e)}")
                continue
        
        print(f"❌ Summary type '{summary_type}' not found in any location")
        return None
        
    except Exception as e:
        print(f"❌ Error getting specific summary: {str(e)}")
        return None


def get_all_summaries(bucket: str, email: str, notebook_id: str, include_metadata: bool = True) -> Dict:
    """Retrieve all available summaries for a notebook"""
    try:
        summaries_prefix = f"notebooks/{email}/{notebook_id}/summaries/"
        print(f"🔍 Looking for summaries in: {summaries_prefix}")
        
        # List all files in summaries directory
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=summaries_prefix)
        
        if 'Contents' not in response:
            print("❌ No summaries directory found")
            return {
                'summaries': [],
                'totalCount': 0,
                'availableTypes': []
            }
        
        print(f"✓ Found {len(response['Contents'])} files in summaries directory")
        
        summaries = []
        summary_types = []
        
        for obj in response['Contents']:
            try:
                file_key = obj['Key']
                filename = file_key.split('/')[-1]
                
                print(f"   📄 Processing: {filename}")
                
                # Skip combined summaries and non-txt files
                if not filename.endswith('.txt') or filename == 'combined_summary.txt':
                    print(f"      ⏭️ Skipping {filename}")
                    continue
                
                # Extract summary type from filename
                if '_summary.txt' in filename:
                    summary_type = filename.replace('_summary.txt', '')
                else:
                    summary_type = filename.replace('.txt', '')
                
                summary_types.append(summary_type)
                print(f"      ✅ Found summary type: {summary_type}")
                
                # Get file content
                file_response = s3_client.get_object(Bucket=bucket, Key=file_key)
                content = file_response['Body'].read().decode('utf-8')
                
                summary_data = {
                    'type': summary_type,
                    'content': content,
                    'filePath': file_key,
                    'fileSize': obj['Size'],
                    'fileSizeFormatted': format_file_size(obj['Size']),
                    'lastModified': obj['LastModified'].isoformat(),
                    'wordCount': len(content.split()),
                    'characterCount': len(content),
                    'estimatedReadingTime': f"{round(len(content.split()) / 200, 1)} minutes",
                    'preview': content[:300] + "..." if len(content) > 300 else content
                }
                
                if include_metadata:
                    # Add additional metadata
                    file_metadata = file_response.get('Metadata', {})
                    summary_data['metadata'] = file_metadata
                    summary_data['contentAnalysis'] = analyze_summary_content(content)
                
                summaries.append(summary_data)
                
            except Exception as e:
                print(f"⚠️ Error processing summary file {obj['Key']}: {str(e)}")
                continue
        
        # Sort summaries by type for consistent ordering
        summaries.sort(key=lambda x: x['type'])
        
        # Check for combined summary
        combined_summary = get_combined_summary(bucket, email, notebook_id)
        
        result = {
            'summaries': summaries,
            'totalCount': len(summaries),
            'availableTypes': sorted(summary_types),
            'combinedSummary': combined_summary,
            'summariesDirectory': summaries_prefix
        }
        
        print(f"✅ Retrieved {len(summaries)} summaries of types: {summary_types}")
        return result
        
    except Exception as e:
        print(f"❌ Error getting all summaries: {str(e)}")
        return {
            'summaries': [],
            'totalCount': 0,
            'availableTypes': [],
            'error': str(e)
        }


def get_combined_summary(bucket: str, email: str, notebook_id: str) -> Optional[Dict]:
    """Get combined summary if it exists"""
    try:
        combined_key = f"notebooks/{email}/{notebook_id}/summaries/combined_summary.txt"
        response = s3_client.get_object(Bucket=bucket, Key=combined_key)
        content = response['Body'].read().decode('utf-8')
        
        return {
            'content': content,
            'filePath': combined_key,
            'fileSize': response['ContentLength'],
            'fileSizeFormatted': format_file_size(response['ContentLength']),
            'lastModified': response['LastModified'].isoformat(),
            'wordCount': len(content.split()),
            'characterCount': len(content),
            'preview': content[:300] + "..." if len(content) > 300 else content
        }
        
    except s3_client.exceptions.NoSuchKey:
        return None
    except Exception as e:
        print(f"⚠️ Error getting combined summary: {str(e)}")
        return None


def get_available_summary_types(bucket: str, email: str, notebook_id: str) -> List[str]:
    """Get list of available summary types"""
    try:
        summaries_prefix = f"notebooks/{email}/{notebook_id}/summaries/"
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=summaries_prefix)
        
        if 'Contents' not in response:
            return []
        
        types = []
        for obj in response['Contents']:
            filename = obj['Key'].split('/')[-1]
            if filename.endswith('_summary.txt') and filename != 'combined_summary.txt':
                summary_type = filename.replace('_summary.txt', '')
                types.append(summary_type)
        
        return sorted(types)
        
    except Exception as e:
        print(f"❌ Error getting available summary types: {str(e)}")
        return []


def analyze_summary_content(content: str) -> Dict:
    """Analyze summary content for additional insights"""
    try:
        lines = content.split('\n')
        paragraphs = [p for p in content.split('\n\n') if p.strip()]
        sentences = [s for s in re.split(r'[.!?]+', content) if s.strip()]
        
        # Extract headings (lines that might be headers)
        potential_headings = []
        for line in lines:
            line = line.strip()
            if line and (line.isupper() or line.startswith('#') or line.endswith(':')):
                potential_headings.append(line)
        
        # Basic readability metrics
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        
        return {
            'lineCount': len(lines),
            'paragraphCount': len(paragraphs),
            'sentenceCount': len(sentences),
            'potentialHeadings': potential_headings[:5],  # First 5 headings
            'avgSentenceLength': round(avg_sentence_length, 1),
            'readingTimeMinutes': round(len(content.split()) / 200, 1)  # Assuming 200 words per minute
        }
        
    except Exception as e:
        print(f"⚠️ Error analyzing content: {str(e)}")
        return {}


def format_file_size(size_bytes):
    """Convert bytes to human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def create_html_response(data: Dict, single_summary: bool = False) -> Dict:
    """Create HTML formatted response"""
    try:
        if single_summary:
            # Single summary
            summary = data['summary']
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>{summary['type'].title()} Summary - {data['notebookId']}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{ 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        margin: 0; padding: 20px; line-height: 1.6; 
                        background: #f5f5f5; color: #333;
                    }}
                    .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; }}
                    .metadata {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #667eea; }}
                    .content {{ white-space: pre-wrap; line-height: 1.8; }}
                    .stat {{ display: inline-block; margin-right: 20px; }}
                    .stat strong {{ color: #667eea; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{summary['type'].title()} Summary</h1>
                        <p>Notebook ID: {data['notebookId']}</p>
                    </div>
                    <div class="metadata">
                        <div class="stat"><strong>Words:</strong> {summary['wordCount']:,}</div>
                        <div class="stat"><strong>Reading Time:</strong> {summary['estimatedReadingTime']}</div>
                        <div class="stat"><strong>File Size:</strong> {summary['fileSizeFormatted']}</div>
                        <div class="stat"><strong>Last Modified:</strong> {summary['lastModified'][:10]}</div>
                    </div>
                    <div class="content">{summary['content']}</div>
                </div>
            </body>
            </html>
            """
        else:
            # Multiple summaries
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>All Summaries - {data['notebookId']}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{ 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        margin: 0; padding: 20px; line-height: 1.6; 
                        background: #f5f5f5; color: #333;
                    }}
                    .container {{ max-width: 1000px; margin: 0 auto; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }}
                    .summary {{ margin-bottom: 30px; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .summary-header {{ background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }}
                    .summary-type {{ font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 10px; }}
                    .metadata {{ font-size: 0.9em; color: #666; }}
                    .content {{ padding: 20px; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }}
                    .stat {{ display: inline-block; margin-right: 15px; }}
                    .expand-btn {{ background: #667eea; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>All Summaries</h1>
                        <p><strong>Notebook:</strong> {data['notebookId']}</p>
                        <p><strong>User:</strong> {data['userEmail']}</p>
                        <p><strong>Total Summaries:</strong> {data['totalCount']}</p>
                        <p><strong>Available Types:</strong> {', '.join(data['availableTypes'])}</p>
                    </div>
            """
            
            for summary in data['summaries']:
                html_content += f"""
                <div class="summary">
                    <div class="summary-header">
                        <div class="summary-type">{summary['type'].title()} Summary</div>
                        <div class="metadata">
                            <span class="stat"><strong>Words:</strong> {summary['wordCount']:,}</span>
                            <span class="stat"><strong>Reading Time:</strong> {summary['estimatedReadingTime']}</span>
                            <span class="stat"><strong>Size:</strong> {summary['fileSizeFormatted']}</span>
                            <span class="stat"><strong>Modified:</strong> {summary['lastModified'][:10]}</span>
                        </div>
                    </div>
                    <div class="content">{summary['content']}</div>
                </div>
                """
            
            html_content += "</div></body></html>"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            'body': html_content
        }
        
    except Exception as e:
        print(f"❌ Error creating HTML response: {str(e)}")
        return create_api_response(500, {'error': 'Failed to generate HTML response'})


def create_plain_text_response(data: Dict, single_summary: bool = False) -> Dict:
    """Create plain text formatted response"""
    try:
        if single_summary:
            # Single summary
            summary = data['summary']
            text_content = f"{summary['type'].upper()} SUMMARY\n"
            text_content += "=" * 50 + "\n"
            text_content += f"Notebook: {data['notebookId']}\n"
            text_content += f"Words: {summary['wordCount']:,} | Reading Time: {summary['estimatedReadingTime']}\n"
            text_content += f"File Size: {summary['fileSizeFormatted']} | Modified: {summary['lastModified'][:10]}\n"
            text_content += "=" * 50 + "\n\n"
            text_content += f"{summary['content']}\n"
        else:
            # Multiple summaries
            text_content = f"ALL SUMMARIES\n"
            text_content += "=" * 50 + "\n"
            text_content += f"Notebook: {data['notebookId']}\n"
            text_content += f"User: {data['userEmail']}\n"
            text_content += f"Total Summaries: {data['totalCount']}\n"
            text_content += f"Available Types: {', '.join(data['availableTypes'])}\n"
            text_content += f"Retrieved: {data['retrievedAt']}\n\n"
            
            for summary in data['summaries']:
                text_content += "=" * 80 + "\n"
                text_content += f"{summary['type'].upper()} SUMMARY\n"
                text_content += f"Words: {summary['wordCount']:,} | Reading Time: {summary['estimatedReadingTime']} | Size: {summary['fileSizeFormatted']}\n"
                text_content += "-" * 50 + "\n"
                text_content += f"{summary['content']}\n\n"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            'body': text_content
        }
        
    except Exception as e:
        print(f"❌ Error creating plain text response: {str(e)}")
        return create_api_response(500, {'error': 'Failed to generate plain text response'})


def create_api_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create API Gateway compatible response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-User-Email',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }