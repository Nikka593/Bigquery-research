"""
Twitter Poster: Posts generated content to X (Twitter) using Tweepy v4.
Supports dry-run mode for testing without actually posting.
"""

import os
import logging
import tweepy
from datetime import datetime

logger = logging.getLogger(__name__)


class TwitterPoster:
    def __init__(self):
        self.dry_run = os.getenv("DRY_RUN", "true").lower() == "true"

        if not self.dry_run:
            self.client = tweepy.Client(
                bearer_token=os.getenv("TWITTER_BEARER_TOKEN"),
                consumer_key=os.getenv("TWITTER_API_KEY"),
                consumer_secret=os.getenv("TWITTER_API_SECRET"),
                access_token=os.getenv("TWITTER_ACCESS_TOKEN"),
                access_token_secret=os.getenv("TWITTER_ACCESS_TOKEN_SECRET"),
                wait_on_rate_limit=True
            )
        else:
            self.client = None
            logger.info("DRY_RUN mode: tweets will NOT be posted to Twitter")

    def post_tweet(self, tweet_text: str, reply_to_id: str = None) -> dict:
        """Post a single tweet. Returns tweet ID and URL."""
        if self.dry_run:
            logger.info(f"[DRY RUN] Would post tweet:\n{tweet_text}\n")
            return {"id": "DRY_RUN_ID", "url": "https://x.com/DRY_RUN", "text": tweet_text}

        kwargs = {"text": tweet_text}
        if reply_to_id:
            kwargs["in_reply_to_tweet_id"] = reply_to_id

        response = self.client.create_tweet(**kwargs)
        tweet_id = response.data["id"]
        url = f"https://x.com/KenkoLabDaily/status/{tweet_id}"
        logger.info(f"Posted tweet: {url}")
        return {"id": tweet_id, "url": url, "text": tweet_text}

    def post_with_thread(self, tweet_data: dict) -> list[dict]:
        """Post a tweet and its thread continuation if present."""
        results = []

        main_result = self.post_tweet(tweet_data["tweet_text"])
        results.append(main_result)

        continuation = tweet_data.get("thread_continuation")
        if continuation:
            thread_result = self.post_tweet(continuation, reply_to_id=main_result["id"])
            results.append(thread_result)

        return results

    def post_daily_schedule(self, posts: list[dict]) -> list[dict]:
        """Log/post all scheduled posts for the day."""
        results = []
        for post in posts:
            timing = post.get("timing", "unknown")
            tweet_data = post.get("tweet", {})
            logger.info(f"Posting {timing} tweet (scheduled: {post.get('scheduled_for')})")
            posted = self.post_with_thread(tweet_data)
            results.extend(posted)
        return results
