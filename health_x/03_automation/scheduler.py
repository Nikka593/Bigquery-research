"""
Main scheduler: Runs daily at 6AM JST to prepare posts,
then posts them at 7AM, 12PM, 9PM JST.

Usage:
  python scheduler.py              # Run scheduler (continuous)
  python scheduler.py --preview    # Preview today's posts without posting
  python scheduler.py --post-now   # Generate and post all 3 now (for testing)
"""

import os
import sys
import json
import logging
import schedule
import time
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("kenklab_posts.log", encoding="utf-8")
    ]
)
logger = logging.getLogger(__name__)

JST = timezone(timedelta(hours=9))


def now_jst() -> datetime:
    return datetime.now(JST)


class DailyPostManager:
    def __init__(self):
        from research_fetcher import ResearchFetcher
        from twitter_poster import TwitterPoster
        self.fetcher = ResearchFetcher()
        self.poster = TwitterPoster()
        self.today_posts: dict[str, dict] = {}  # timing -> post data

    def prepare_posts(self):
        """Run at 6AM JST: fetch research and generate all 3 posts."""
        logger.info(f"=== Preparing daily posts [{now_jst().strftime('%Y-%m-%d')}] ===")
        posts = self.fetcher.prepare_daily_posts()
        self.today_posts = {p["timing"]: p for p in posts}

        # Save to JSON for review
        with open("today_posts.json", "w", encoding="utf-8") as f:
            json.dump(self.today_posts, f, ensure_ascii=False, indent=2)

        logger.info("Posts prepared and saved to today_posts.json")
        self._preview_posts()

    def post_morning(self):
        self._post_by_timing("morning")

    def post_noon(self):
        self._post_by_timing("noon")

    def post_night(self):
        self._post_by_timing("night")

    def _post_by_timing(self, timing: str):
        if not self.today_posts:
            logger.warning(f"No posts prepared for today. Regenerating...")
            self.prepare_posts()

        post = self.today_posts.get(timing)
        if not post:
            logger.error(f"No post found for timing: {timing}")
            return

        logger.info(f"=== Posting [{timing}] tweet ===")
        results = self.poster.post_with_thread(post["tweet"])
        for r in results:
            logger.info(f"Result: {r['url']}")

    def _preview_posts(self):
        print("\n" + "="*60)
        print(f"PREVIEW: Today's Posts [{now_jst().strftime('%Y-%m-%d')}]")
        print("="*60)
        for timing, post in self.today_posts.items():
            print(f"\n[{timing.upper()} - {post['scheduled_for']}]")
            print("-"*40)
            print(post["tweet"]["tweet_text"])
            if post["tweet"].get("thread_continuation"):
                print("\n[Thread continuation:]")
                print(post["tweet"]["thread_continuation"])
        print("="*60 + "\n")


def run_scheduler():
    """Start the continuous scheduler."""
    manager = DailyPostManager()

    # Schedule in JST (convert to UTC for schedule library if needed)
    # Using JST times directly since server should be set to JST
    # Or run with TZ=Asia/Tokyo python scheduler.py
    schedule.every().day.at("06:00").do(manager.prepare_posts)
    schedule.every().day.at("07:00").do(manager.post_morning)
    schedule.every().day.at("12:00").do(manager.post_noon)
    schedule.every().day.at("21:00").do(manager.post_night)

    logger.info("Scheduler started. Waiting for scheduled times...")
    logger.info("Schedule: Prepare@06:00, Morning@07:00, Noon@12:00, Night@21:00 (JST)")

    while True:
        schedule.run_pending()
        time.sleep(30)


def preview_mode():
    """Preview today's posts without posting."""
    os.environ["DRY_RUN"] = "true"
    manager = DailyPostManager()
    manager.prepare_posts()


def post_now_mode():
    """Generate and immediately post all 3 tweets (for testing)."""
    manager = DailyPostManager()
    manager.prepare_posts()
    manager.post_morning()
    manager.post_noon()
    manager.post_night()


if __name__ == "__main__":
    if "--preview" in sys.argv:
        preview_mode()
    elif "--post-now" in sys.argv:
        post_now_mode()
    else:
        run_scheduler()
