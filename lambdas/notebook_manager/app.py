"""
Notebook-Manager Lambda
—————————
Environment variables required
  TABLE   = DynamoDB table name   (e.g. Notebooks)
  REGION  = AWS region            (e.g. eu-central-1)

Optional
  PAGE_SIZE = default items per list-page (default 20)

Local dev:   put them in a .env file and install python-dotenv
             pip install python-dotenv
"""
from __future__ import annotations
import os, json, uuid, datetime, decimal
from typing import Any, Dict, List

import boto3
from boto3.dynamodb.conditions import Key

# ---------- optional .env support ----------
try:
    # no-op in Lambda
    from dotenv import load_dotenv, find_dotenv

    load_dotenv(find_dotenv())
except ModuleNotFoundError:
    pass
# -------------------------------------------

TABLE_NAME = os.getenv("TABLE", "Notebooks")
REGION     = os.getenv("REGION", "us-east-1")
PAGE_SIZE  = int(os.getenv("PAGE_SIZE", "20"))

ddb   = boto3.resource("dynamodb", region_name=REGION)
table = ddb.Table(TABLE_NAME)


# DynamoDB returns Decimal for all numbers; json.dumps can’t handle that
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 == 0:
                return int(o)
            return float(o)
        return super().default(o)


# ------------- helpers -------------
def resp(code: int, body: Any) -> Dict[str, Any]:
    return {
        "statusCode": code,
        "body": json.dumps(body, cls=DecimalEncoder),
        "headers": {"Content-Type": "application/json"},
    }


def now_iso() -> str:
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()


def parse_body(event) -> Dict[str, Any]:
    if event.get("body") in (None, "", "null"):
        return {}
    return json.loads(event["body"])


# ------------- CRUD operations -------------
def create_notebook(data: Dict[str, Any]) -> Dict[str, Any]:
    nb_id = str(uuid.uuid4())
    item = {
        "NotebookId": nb_id,
        "Title": data.get("title", f"Untitled – {nb_id[:8]}"),
        "CreatedAt": now_iso(),
        "UpdatedAt": now_iso(),
        "Sections": data.get("sections", []),
        # you may add more attributes later (OwnerId, Tags, …)
    }
    table.put_item(Item=item)
    return item


def get_notebook(nb_id: str) -> Dict[str, Any]:
    res = table.get_item(Key={"NotebookId": nb_id})
    return res.get("Item")


def list_notebooks(last_evaluated_key: Dict[str, Any] | None = None) -> Dict[str, Any]:
    kwargs = {"Limit": PAGE_SIZE}
    if last_evaluated_key:
        kwargs["ExclusiveStartKey"] = last_evaluated_key
    scan = table.scan(**kwargs)
    return {
        "items": scan["Items"],
        "lastKey": scan.get("LastEvaluatedKey"),
    }


def patch_notebook(nb_id: str, data: Dict[str, Any]) -> None:
    """
    Allowed payload keys:
      title        – replace title
      section      – dict to append to Sections list
    """
    exprs: List[str] = []
    values = {}

    if "title" in data:
        exprs.append("Title = :t")
        values[":t"] = data["title"]

    if "section" in data:
        exprs.append("Sections = list_append(if_not_exists(Sections, :empty), :s)")
        values[":s"] = [data["section"]]
        values[":empty"] = []

    if not exprs:
        return

    expr_str = "SET " + ", ".join(exprs) + ", UpdatedAt=:u"
    values[":u"] = now_iso()

    table.update_item(
        Key={"NotebookId": nb_id},
        UpdateExpression=expr_str,
        ExpressionAttributeValues=values,
    )


def delete_notebook(nb_id: str) -> None:
    table.delete_item(Key={"NotebookId": nb_id})


# ------------- Lambda entrypoint -------------
def lambda_handler(event, _context):
    method = event["requestContext"]["http"]["method"]
    path   = event["rawPath"]
    params = event.get("pathParameters") or {}

    if method == "POST" and path == "/notebook":
        body = parse_body(event)
        return resp(201, create_notebook(body))

    if method == "GET" and path == "/notebook":
        # list with optional pagination key from query-string ?lastKey=…
        last_key = None
        if (q := event.get("queryStringParameters")) and q.get("lastKey"):
            last_key = json.loads(q["lastKey"])
        return resp(200, list_notebooks(last_key))

    if "id" in params:
        nb_id = params["id"]

        if method == "GET":
            item = get_notebook(nb_id)
            if item:
                return resp(200, item)
            return resp(404, {"error": "not found"})

        if method == "PATCH":
            patch_notebook(nb_id, parse_body(event))
            return resp(204, {})  # no content

        if method == "DELETE":
            delete_notebook(nb_id)
            return resp(204, {})

    return resp(405, {"error": "method not allowed"})
