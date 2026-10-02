import os
import json
import hashlib
import redis

from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True
)


def set_cache(key, value, expire=3600):

    redis_client.set(
        key,
        json.dumps(value),
        ex=expire
    )


def get_cache(key):

    value = redis_client.get(key)

    if value:
        return json.loads(value)

    return None


def create_cache_key(question):

    normalized_question = question.strip().lower()

    question_hash = hashlib.sha256(
        normalized_question.encode()
    ).hexdigest()

    return f"chat:{question_hash}"


def clear_chat_cache():

    keys = redis_client.scan_iter(
        match="chat:*"
    )

    deleted_count = 0

    for key in keys:

        redis_client.delete(key)

        deleted_count += 1

    print(
        f"Redis chat cache cleared: {deleted_count} keys deleted."
    )