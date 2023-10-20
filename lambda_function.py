import json
import os

from misskey import Misskey


def lambda_handler(event, context):
    print(json.dumps(event))
    print(context)

    result = run(json.loads(event["body"]))

    return {
        "statusCode": 200,
        "body": json.dumps(result),
    }


def run(body: dict) -> dict:
    print(json.dumps(body))

    mk = Misskey(
        address="misskey.io",
        i=os.environ["MISSKEY_TOKEN"],
    )

    if body["type"] == "followed":
        return mk.following_create(body["body"]["user"]["id"])
    if body["type"] == "renote":
        return mk.following_create(body["body"]["note"]["user"]["id"])

    return {}
