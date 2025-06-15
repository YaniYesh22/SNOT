# ==========================================
# LAMBDA 2: SUMMARY PROCESSOR (Background) - IMPROVED
# File name: notebook-summary-processor
# ==========================================

import json
import boto3
import os
import logging
import time
import random
from datetime import datetime
import decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
bedrock_client = boto3.client('bedrock-runtime')

# Fix DynamoDB table reference
TABLE_NAME = os.environ.get("NOTEBOOKS_TABLE")
if not TABLE_NAME:
    logger.warning("NOTEBOOKS_TABLE environment variable not set, using default")
    TABLE_NAME = "smart-notebook-table"  # Replace with your actual table name

TABLE = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    """
    Background processor for summary generation
    This runs asynchronously and can take several minutes
    """
    try:
        print("=== Summary Processor Lambda Started ===")
        print(f"Event: {json.dumps(event, default=str)}")
        
        notebook_id = event['notebookId']
        user_email = event['userEmail']
        summary_types = event['summaryTypes']
        task_id = event['taskId']
        s3_metadata_key = event['s3MetadataKey']
        s3_bucket = event['s3Bucket']
        notebook_title = event.get('notebookTitle', 'Untitled Notebook')
        
        pk = f"USER#{user_email}"
        sk = f"NOTEBOOK#{notebook_id}"
        
        print(f"✓ Processing summaries for notebook: {notebook_title}")
        print(f"✓ User: {user_email}")
        print(f"✓ Summary types: {summary_types}")
        print(f"✓ Task ID: {task_id}")
        
        # Validate the task is still valid (check if it wasn't cancelled)
        try:
            response = TABLE.get_item(Key={"PK": pk, "SK": sk})
            if "Item" not in response:
                print("❌ Notebook not found, aborting summary generation")
                return
            
            notebook = response["Item"]
            current_task_id = notebook.get("summaryTaskId")
            
            if current_task_id != task_id:
                print(f"❌ Task ID mismatch. Expected: {task_id}, Current: {current_task_id}")
                print("Summary generation was likely cancelled or restarted")
                return
            
        except Exception as e:
            print(f"❌ Failed to validate task: {str(e)}")
            return
        
        # 🆕 IMPROVED CONTENT LOADING - Skip metadata chunks, go directly to files
        try:
            print("📖 Loading notebook content from processed files...")
            content = load_content_from_processed_files(s3_bucket, user_email, notebook_id)
            if not content:
                raise Exception("No processed files found or content is empty")
            
            content_length = len(content)
            word_count = len(content.split())
            print(f"✓ Loaded notebook content: {content_length:,} characters, ~{word_count:,} words")
            
            if content_length < 100:
                raise Exception("Notebook content too short for meaningful summary")
                
        except Exception as e:
            error_msg = f"Failed to load content: {str(e)}"
            print(f"❌ {error_msg}")
            update_summary_status(pk, sk, "failed", error=error_msg)
            return
        
        # Generate summaries
        summaries = {}
        summary_s3_paths = {}
        successful_summaries = []
        failed_summaries = []
        
        for i, summary_type in enumerate(summary_types):
            try:
                print(f"🔄 Generating {summary_type} summary ({i+1}/{len(summary_types)})...")
                
                # Update progress
                update_summary_progress(pk, sk, summary_type, "generating")
                
                # Progressive delay to avoid throttling (from your working version)
                if i > 0:
                    delay = 10 + (i * 5)  # 10, 15, 20 seconds between requests
                    print(f"⏳ Waiting {delay} seconds before next request...")
                    time.sleep(delay)
                
                # Generate summary using your improved function
                summary_text = generate_summary_with_retry(content, summary_type)
                
                if not summary_text or len(summary_text.strip()) < 50:
                    raise Exception(f"{summary_type} summary is too short or empty")
                
                summary_word_count = len(summary_text.split())
                print(f"✓ Generated {summary_type} summary: {len(summary_text):,} characters, ~{summary_word_count:,} words")
                
                # Save summary to S3
                s3_key = f"notebooks/{user_email}/{notebook_id}/summaries/{summary_type}_summary.txt"
                s3_url = f"s3://{s3_bucket}/{s3_key}"
                
                # Add metadata to the summary file (enhanced)
                summary_with_metadata = f"""# {summary_type.title()} Summary
# Notebook: {notebook_title}
# Generated: {datetime.now().isoformat()}
# Word Count: ~{summary_word_count:,}
# Method: Async S3-based RAG with Rate Limiting

{summary_text}"""
                
                s3_client.put_object(
                    Bucket=s3_bucket,
                    Key=s3_key,
                    Body=summary_with_metadata.encode('utf-8'),
                    ContentType='text/plain',
                    Metadata={
                        'notebook-id': notebook_id,
                        'user-email': user_email,
                        'summary-type': summary_type,
                        'generated-at': datetime.now().isoformat(),
                        'word-count': str(summary_word_count),
                        'task-id': task_id
                    }
                )
                
                summaries[summary_type] = s3_url
                summary_s3_paths[summary_type] = s3_key
                successful_summaries.append(summary_type)
                
                print(f"✅ {summary_type} summary completed and saved to S3")
                
                # Update progress
                update_summary_progress(pk, sk, summary_type, "completed")
                
            except Exception as e:
                error_msg = f"Failed to generate {summary_type} summary: {str(e)}"
                print(f"❌ {error_msg}")
                failed_summaries.append({"type": summary_type, "error": str(e)})
                update_summary_progress(pk, sk, summary_type, "failed", str(e))
                continue
        
        # 🆕 Create combined report if successful summaries exist
        if successful_summaries:
            try:
                combined_summary = create_combined_report(summaries, successful_summaries, failed_summaries, notebook_id, user_email)
                combined_key = f"notebooks/{user_email}/{notebook_id}/summaries/combined_summary.txt"
                s3_client.put_object(
                    Bucket=s3_bucket,
                    Key=combined_key,
                    Body=combined_summary.encode('utf-8'),
                    ContentType='text/plain'
                )
                print("✓ Created combined summary report")
            except Exception as e:
                print(f"⚠️ Failed to create combined report: {str(e)}")
        
        # Update final status
        if summaries:
            try:
                # Determine final status
                if len(successful_summaries) == len(summary_types):
                    final_status = "completed"
                    status_message = f"All {len(successful_summaries)} summaries generated successfully"
                else:
                    final_status = "partial_success"
                    status_message = f"{len(successful_summaries)}/{len(summary_types)} summaries completed"
                
                # Update notebook with summary information
                update_expression = """
                    SET summaryStatus = :status,
                        summaries = :summaries,
                        summaryCompletedAt = :completed_at,
                        summaryTypes = :types,
                        summaryCount = :count,
                        has_summaries = :has_summaries,
                        last_summarization_date = :last_summary
                    REMOVE summaryTaskId
                """
                
                expression_values = {
                    ":status": final_status,
                    ":summaries": summaries,
                    ":completed_at": datetime.now().isoformat(),
                    ":types": successful_summaries,
                    ":count": len(summaries),
                    ":has_summaries": True,
                    ":last_summary": datetime.now().isoformat()
                }
                
                # Add error info if there were failures
                if failed_summaries:
                    update_expression += ", summaryErrors = :errors"
                    expression_values[":errors"] = failed_summaries
                
                TABLE.update_item(
                    Key={"PK": pk, "SK": sk},
                    UpdateExpression=update_expression,
                    ExpressionAttributeValues=expression_values
                )
                
                print(f"✅ Summary generation completed: {status_message}")
                print(f"   Successful: {successful_summaries}")
                if failed_summaries:
                    print(f"   Failed: {[f['type'] for f in failed_summaries]}")
                    
            except Exception as e:
                print(f"❌ Failed to update final status: {str(e)}")
                # Try to update with error status
                update_summary_status(pk, sk, "failed", f"Summary generated but failed to save status: {str(e)}")
        else:
            error_msg = f"No summaries were generated successfully. Failures: {failed_summaries}"
            print(f"❌ {error_msg}")
            update_summary_status(pk, sk, "failed", error_msg)
            
    except Exception as e:
        print(f"❌ Summary processor critical error: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        
        try:
            pk = f"USER#{event.get('userEmail', 'unknown')}"
            sk = f"NOTEBOOK#{event.get('notebookId', 'unknown')}"
            update_summary_status(pk, sk, "failed", f"Critical processing error: {str(e)}")
        except:
            print("❌ Failed to update error status")


def load_content_from_processed_files(bucket: str, email: str, notebook_uuid: str) -> str:
    """
    Load content directly from processed files - simple and reliable approach
    """
    try:
        print(f"🔍 Looking for processed files in: notebooks/{email}/{notebook_uuid}/processed/")
        
        # Check processed files first
        prefix = f"notebooks/{email}/{notebook_uuid}/processed/"
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
        
        content_parts = []
        
        if 'Contents' in response:
            print(f"✓ Found {len(response['Contents'])} items in processed folder")
            
            for obj in response['Contents']:
                if obj['Key'].endswith('.txt'):
                    try:
                        print(f"📄 Loading processed file: {obj['Key']}")
                        file_response = s3_client.get_object(Bucket=bucket, Key=obj['Key'])
                        content = file_response['Body'].read().decode('utf-8')
                        
                        # Skip very short content
                        if len(content.strip()) < 50:
                            print(f"⚠️ Skipping short content in {obj['Key']}: {len(content)} characters")
                            continue
                        
                        filename = obj['Key'].split('/')[-1]
                        content_parts.append(f"\n=== PROCESSED FILE: {filename} ===\n{content}\n")
                        print(f"✅ Loaded {len(content)} characters from {filename}")
                        
                    except Exception as e:
                        print(f"❌ Error reading {obj['Key']}: {str(e)}")
                        continue
        else:
            print("⚠️ No processed files found, checking raw files...")
            
            # Fallback to raw files
            files_prefix = f"notebooks/{email}/{notebook_uuid}/files/"
            files_response = s3_client.list_objects_v2(Bucket=bucket, Prefix=files_prefix)
            
            if 'Contents' in files_response:
                print(f"✓ Found {len(files_response['Contents'])} items in files folder")
                
                for obj in files_response['Contents']:
                    # Only try to read text files directly
                    if obj['Key'].endswith('.txt'):
                        try:
                            print(f"📄 Loading raw text file: {obj['Key']}")
                            file_response = s3_client.get_object(Bucket=bucket, Key=obj['Key'])
                            content = file_response['Body'].read().decode('utf-8')
                            
                            if len(content.strip()) > 50:
                                filename = obj['Key'].split('/')[-1]
                                content_parts.append(f"\n=== RAW FILE: {filename} ===\n{content}\n")
                                print(f"✅ Loaded {len(content)} characters from {filename}")
                        except Exception as e:
                            print(f"❌ Error reading raw file {obj['Key']}: {str(e)}")
                            continue
        
        if content_parts:
            combined_content = '\n'.join(content_parts)
            print(f"🎉 Successfully loaded content: {len(combined_content)} total characters from {len(content_parts)} files")
            return combined_content
        else:
            print("❌ No valid content found in any files")
            
            # Last resort: list everything to see what's actually there
            print("🔍 Listing all files in notebook to debug:")
            all_prefix = f"notebooks/{email}/{notebook_uuid}/"
            all_response = s3_client.list_objects_v2(Bucket=bucket, Prefix=all_prefix)
            
            if 'Contents' in all_response:
                for obj in all_response['Contents']:
                    print(f"  📁 Found: {obj['Key']} (size: {obj['Size']} bytes)")
            else:
                print("  📭 No files found at all in notebook")
            
            return None
        
    except Exception as e:
        print(f"❌ Error in load_content_from_processed_files: {str(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return None
        # Remove the old long function completely - it's replaced with the simple one above


def create_combined_report(summaries, successful_summaries, failed_summaries, notebook_id, user_email):
    """Create combined report with all summaries"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    report_parts = [
        f"# Comprehensive Summary Report",
        f"**Notebook ID:** {notebook_id}",
        f"**User:** {user_email}",
        f"**Generated:** {timestamp}",
        f"**Method:** Async S3-based RAG with Rate Limiting",
        f"**Successful Summaries:** {', '.join(successful_summaries) if successful_summaries else 'None'}",
        f"**Failed Summaries:** {', '.join([f['type'] for f in failed_summaries]) if failed_summaries else 'None'}",
        "\n" + "=" * 60 + "\n"
    ]
    
    # Add each successful summary
    for summary_type in successful_summaries:
        if summary_type in summaries:
            # Load the actual summary content from S3
            try:
                s3_url = summaries[summary_type]
                s3_key = s3_url.replace(f"s3://{os.environ.get('S3_BUCKET', 'smart-notebook-media')}/", "")
                
                response = s3_client.get_object(Bucket=os.environ.get('S3_BUCKET', 'smart-notebook-media'), Key=s3_key)
                summary_content = response['Body'].read().decode('utf-8')
                
                report_parts.extend([
                    f"## {summary_type.title()} Summary",
                    "",
                    summary_content,
                    "\n" + "-" * 40 + "\n"
                ])
            except Exception as e:
                print(f"⚠️ Could not load {summary_type} summary for combined report: {e}")
                report_parts.extend([
                    f"## {summary_type.title()} Summary",
                    "",
                    f"[Summary available at: {summaries[summary_type]}]",
                    "\n" + "-" * 40 + "\n"
                ])
    
    # Add error section if there were failures
    if failed_summaries:
        report_parts.extend([
            "## Generation Errors",
            "",
            "The following summaries could not be generated:",
            ""
        ])
        for failure in failed_summaries:
            report_parts.append(f"- **{failure['type'].title()}:** {failure['error']}")
        
        report_parts.append("\n" + "-" * 40 + "\n")
    
    return "\n".join(report_parts)


def update_summary_status(pk, sk, status, error=None):
    """Update summary status in DynamoDB"""
    try:
        update_expression = "SET summaryStatus = :status, updatedAt = :updated_at"
        expression_values = {
            ":status": status,
            ":updated_at": datetime.now().isoformat()
        }
        
        if error:
            update_expression += ", summaryError = :error"
            expression_values[":error"] = error
        
        if status in ["completed", "failed", "partial_success"]:
            update_expression += " REMOVE summaryTaskId"
        
        TABLE.update_item(
            Key={"PK": pk, "SK": sk},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        print(f"✓ Updated summary status to: {status}")
        
    except Exception as e:
        print(f"❌ Failed to update summary status: {e}")


def update_summary_progress(pk, sk, summary_type, status, error=None):
    """Update progress for individual summary type"""
    try:
        progress_data = {
            "status": status,
            "updatedAt": datetime.now().isoformat()
        }
        
        if error:
            progress_data["error"] = error
        
        TABLE.update_item(
            Key={"PK": pk, "SK": sk},
            UpdateExpression=f"SET summaryProgress.{summary_type} = :progress",
            ExpressionAttributeValues={":progress": progress_data}
        )
        print(f"✓ Updated {summary_type} progress: {status}")
        
    except Exception as e:
        print(f"❌ Failed to update summary progress for {summary_type}: {e}")


def generate_summary_with_retry(content: str, summary_type: str, max_retries: int = 3) -> str:
    """Generate comprehensive summary with exponential backoff retry logic"""
    
    # Increase content length limit for more comprehensive summaries
    max_content_length = 150000  # Increased from 80k to 150k
    if len(content) > max_content_length:
        # Try to truncate at sentence boundaries to maintain context
        truncated_content = content[:max_content_length]
        last_period = truncated_content.rfind('.')
        if last_period > max_content_length * 0.8:  # If we find a period in the last 20%
            content = truncated_content[:last_period + 1]
        else:
            content = truncated_content
        content += "\n\n[Content truncated due to length limitations...]"
    
    prompts = {
        'academic': f"""You are an expert academic researcher and writer. Provide a comprehensive, scholarly summary of the following notebook content. Your summary should be substantial, detailed, and follow academic standards.

**REQUIREMENTS:**
- Length: 1500-2500 words minimum
- Structure: Use clear academic sections with headers
- Depth: Provide thorough analysis, not just surface-level points
- Citations: Reference specific examples from the content
- Critical thinking: Include analysis, implications, and connections

**STRUCTURE YOUR RESPONSE WITH THESE SECTIONS:**

## Executive Summary
Provide a concise overview (200-300 words) of the entire content, highlighting the most critical findings and contributions.

## Key Findings and Main Arguments
- Identify and elaborate on all major findings, theories, or arguments presented
- Explain the significance of each finding in detail
- Discuss how findings relate to each other and build upon one another
- Include specific data points, statistics, or evidence mentioned

## Methodological Analysis
- Detail any research methods, approaches, or frameworks discussed
- Analyze the strengths and limitations of methodologies presented
- Discuss experimental designs, data collection methods, or analytical approaches
- Comment on the validity and reliability of methods used

## Theoretical Framework and Conceptual Foundation
- Identify and explain all theoretical concepts, models, or frameworks
- Discuss how theories are applied or tested in the content
- Explain the historical context or evolution of concepts presented
- Connect theories to practical applications or real-world scenarios

## Evidence and Supporting Data
- Comprehensively review all evidence, data, statistics, and examples provided
- Analyze the quality and reliability of evidence presented
- Discuss patterns, trends, or relationships revealed in the data
- Comment on any gaps in evidence or areas needing further research

## Critical Analysis and Evaluation
- Provide objective assessment of arguments and evidence quality
- Identify strengths and weaknesses in reasoning or methodology
- Discuss potential biases, limitations, or alternative interpretations
- Evaluate the credibility and significance of sources or references

## Implications and Applications
- Discuss theoretical implications for the field or discipline
- Analyze practical applications and real-world relevance
- Consider policy implications or recommendations for practice
- Explore potential future research directions or questions raised

## Connections and Cross-References
- Link concepts across different sections of the content
- Identify relationships between different topics or themes
- Connect findings to broader academic literature or current debates
- Highlight interdisciplinary connections where relevant

## Conclusion and Future Directions
- Synthesize all major points into coherent conclusions
- Assess the overall contribution and significance of the content
- Suggest areas for future investigation or development
- Provide final scholarly assessment of the work's value

**Content to Analyze:**
{content}

Please provide your comprehensive academic summary following the structure above:""",

        'casual': f"""You are a skilled science communicator and educational content creator. Transform this complex notebook content into an engaging, comprehensive summary that anyone can understand and enjoy reading.

**REQUIREMENTS:**
- Length: 1200-2000 words minimum
- Tone: Conversational, friendly, and engaging
- Style: Use storytelling elements, analogies, and real-world examples
- Accessibility: Explain complex concepts in simple terms
- Engagement: Make it interesting and relatable

**STRUCTURE YOUR RESPONSE WITH THESE SECTIONS:**

## What's This All About? (The Big Picture)
Start with an engaging hook that explains why this content matters in everyday terms. Use analogies or real-world comparisons to make complex ideas accessible.

## The Main Story (Key Points Explained Simply)
Break down the most important findings or concepts using:
- Simple, jargon-free language
- Everyday analogies and metaphors
- Concrete examples people can relate to
- Step-by-step explanations for complex processes
- "Think of it like..." comparisons

## The Evidence (Why Should We Believe This?)
Explain the supporting evidence in accessible terms:
- What kind of research or data supports these points?
- Use concrete numbers and statistics, but explain what they mean
- Share interesting case studies or examples
- Explain research methods in simple terms (e.g., "Scientists tested this by...")

## Real-World Impact (Why This Matters to You)
- How does this affect everyday life?
- What practical applications exist now or in the future?
- Share specific examples of how this knowledge is being used
- Discuss benefits, risks, or considerations for regular people
- Include success stories or interesting applications

## The Controversy Corner (Different Viewpoints)
- Are there debates or disagreements about these topics?
- Present different perspectives fairly and simply
- Explain why experts might disagree
- Help readers understand the nuances without taking sides

## Cool Facts and Surprising Discoveries
- Highlight the most interesting, surprising, or counterintuitive findings
- Share "Did you know?" type facts
- Include historical context or evolution of ideas
- Mention breakthrough moments or paradigm shifts

## What's Next? (Future Possibilities)
- Where is this field heading?
- What exciting developments might we see?
- How might this change our lives in 5-10 years?
- What questions still need answers?

## The Bottom Line (Key Takeaways)
Summarize the most important points readers should remember:
- 5-7 key takeaways in simple language
- Practical advice or actionable insights
- Final thoughts on significance and relevance

**Content to Summarize:**
{content}

Please provide your engaging, comprehensive casual summary following the structure above:""",

        'simple': f"""Create a comprehensive yet accessible bullet-point summary of this notebook content. Focus on clarity, organization, and completeness while maintaining simplicity.

**REQUIREMENTS:**
- Length: 800-1200 words minimum
- Format: Organized bullet points with clear categories
- Style: Simple, direct language
- Coverage: Include all major topics and subtopics
- Structure: Logical flow from general to specific

**ORGANIZE YOUR SUMMARY USING THIS STRUCTURE:**

## 📋 OVERVIEW
• Main topic/subject of the content
• Primary purpose or objective
• Scope and key areas covered
• Why this information is important

## 🎯 MAIN FINDINGS & KEY POINTS
• [List all major discoveries, conclusions, or main arguments]
• [Include specific data, statistics, or measurements where mentioned]
• [Note any surprising or counterintuitive findings]
• [Highlight breakthrough insights or new information]

## 🔬 METHODS & APPROACHES
• Research methods or analytical approaches used
• Data sources and collection methods
• Tools, technologies, or frameworks applied
• Study design or experimental setup (if applicable)

## 📊 EVIDENCE & DATA
• Key statistics, numbers, or measurements
• Important graphs, charts, or data visualizations described
• Case studies or examples provided
• Comparison data or benchmarks mentioned

## 💡 CONCEPTS & THEORIES
• Main theories or conceptual frameworks discussed
• Key definitions and terminology
• Models or systems explained
• Cause-and-effect relationships identified

## ⚖️ PROS & CONS / STRENGTHS & LIMITATIONS
• Advantages or benefits identified
• Disadvantages, risks, or limitations noted
• Strengths of methods or approaches
• Areas needing improvement or further research

## 🌍 REAL-WORLD APPLICATIONS
• Practical uses or applications mentioned
• Industries or fields where this applies
• Current implementations or success stories
• Potential future uses or developments

## 🔗 CONNECTIONS & RELATIONSHIPS
• How different concepts connect to each other
• Relationships between variables or factors
• Cross-references to related topics or fields
• Dependencies or prerequisites identified

## ❓ UNRESOLVED QUESTIONS & FUTURE RESEARCH
• Open questions that need further investigation
• Areas where more research is needed
• Suggested next steps or future directions
• Gaps in current knowledge or understanding

## 📝 KEY TAKEAWAYS
• [5-8 most important points to remember]
• [Essential facts everyone should know]
• [Critical insights or conclusions]
• [Practical implications for readers]

## 📚 ADDITIONAL CONTEXT
• Historical background or evolution of ideas
• Comparison with previous research or methods
• Relevant context or background information
• Related fields or disciplines involved

**Content to Summarize:**
{content}

Please provide your comprehensive bullet-point summary following the structure above:"""
    }
    
    for attempt in range(max_retries):
        try:
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 8000,  # Increased from 3000 to 8000 for longer summaries
                "messages": [{"role": "user", "content": prompts[summary_type]}],
                "temperature": 0.2,  # Reduced for more consistent, focused output
                "top_p": 0.85       # Slightly reduced for better coherence
            }
            
            response = bedrock_client.invoke_model(
                modelId='anthropic.claude-3-sonnet-20240229-v1:0',
                body=json.dumps(request_body),
                contentType='application/json'
            )
            
            response_body = json.loads(response['body'].read())
            summary = response_body['content'][0]['text'].strip()
            
            # Validate summary length and quality
            word_count = len(summary.split())
            min_words = {'academic': 1200, 'casual': 800, 'simple': 600}
            
            if word_count < min_words.get(summary_type, 500):
                logger.warning(f"{summary_type} summary only {word_count} words, may be too short")
            
            logger.info(f"Successfully generated {summary_type} summary on attempt {attempt + 1}")
            logger.info(f"Summary length: {word_count} words, {len(summary)} characters")
            return summary
            
        except Exception as e:
            error_str = str(e)
            logger.warning(f"Attempt {attempt + 1} failed for {summary_type} summary: {error_str}")
            
            # Check if it's a throttling error
            if any(keyword in error_str.lower() for keyword in ["throttling", "too many requests", "rate limit", "quota"]):
                if attempt < max_retries - 1:
                    # Exponential backoff with jitter for throttling
                    base_delay = (2 ** attempt) * 8  # Increased base delay
                    jitter = random.uniform(2, 8)    # Increased jitter range
                    delay = base_delay + jitter
                    logger.info(f"Throttling detected, waiting {delay:.1f} seconds before retry...")
                    time.sleep(delay)
                    continue
                else:
                    raise Exception(f"Failed after {max_retries} attempts due to throttling: {error_str}")
            
            # Check if it's a content length error
            elif any(keyword in error_str.lower() for keyword in ["content too long", "input too large", "token limit"]):
                if attempt < max_retries - 1:
                    # Reduce content length and retry
                    current_length = len(content)
                    new_length = int(current_length * 0.7)  # Reduce by 30%
                    logger.info(f"Content too long, reducing from {current_length} to {new_length} characters")
                    
                    truncated_content = content[:new_length]
                    last_period = truncated_content.rfind('.')
                    if last_period > new_length * 0.8:
                        content = truncated_content[:last_period + 1]
                    else:
                        content = truncated_content
                    content += "\n\n[Content truncated due to length limitations...]"
                    
                    # Update the prompt with new content
                    for key in prompts:
                        if key == summary_type:
                            # Find the content section and replace it
                            content_marker = "**Content to "
                            if content_marker in prompts[key]:
                                before_content = prompts[key].split(content_marker)[0]
                                after_content_start = prompts[key].find(content_marker)
                                after_content_full = prompts[key][after_content_start:]
                                header_end = after_content_full.find('\n') + 1
                                header = after_content_full[:header_end]
                                prompts[key] = before_content + content_marker + header + content + "\n\nPlease provide your comprehensive " + summary_type + " summary following the structure above:"
                            break
                    continue
                else:
                    raise Exception(f"Content too long even after truncation: {error_str}")
            
            else:
                # Non-retryable error
                logger.error(f"Non-retryable error on attempt {attempt + 1}: {error_str}")
                if attempt < max_retries - 1:
                    # Still retry once for unexpected errors
                    delay = 3 + random.uniform(1, 3)
                    logger.info(f"Unexpected error, waiting {delay:.1f} seconds before retry...")
                    time.sleep(delay)
                    continue
                else:
                    raise Exception(f"Non-retryable error: {error_str}")
    
    raise Exception(f"Failed to generate {summary_type} summary after {max_retries} attempts")