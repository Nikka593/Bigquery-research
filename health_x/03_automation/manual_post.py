"""
Manual Post Helper: For days when you want to review and manually approve
each post before it goes live.

Usage:
  python manual_post.py           # Interactive mode: review & approve each post
  python manual_post.py --edit    # Interactive mode with editing capability
"""

import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()

# Default to dry-run for safety
if "--live" not in sys.argv:
    os.environ["DRY_RUN"] = "true"
    print("⚠️  Running in DRY RUN mode. Use --live to actually post.")
else:
    print("🚨 LIVE MODE: Posts will be published to @KenkoLabDaily")

from research_fetcher import ResearchFetcher
from twitter_poster import TwitterPoster


def interactive_review():
    fetcher = ResearchFetcher()
    poster = TwitterPoster()

    print("\n🧬 KenkoLab Daily Post Manager")
    print("="*50)
    print("Fetching today's top health research...\n")

    posts = fetcher.prepare_daily_posts()
    approved_posts = []

    for i, post in enumerate(posts, 1):
        timing = post["timing"]
        tweet_text = post["tweet"]["tweet_text"]
        finding = post["finding"]

        print(f"\n{'='*50}")
        print(f"POST {i}/3: [{timing.upper()}] - {post['scheduled_for']}")
        print(f"Category: {finding.get('category', 'Unknown')}")
        print(f"Source: {finding.get('source', 'Unknown')}")
        print(f"Relevance Score: {finding.get('relevance_score', 0)}/100")
        print(f"{'='*50}")
        print(tweet_text)

        if post["tweet"].get("thread_continuation"):
            print("\n[Thread continuation:]")
            print(post["tweet"]["thread_continuation"])

        print("\nOptions: [a]pprove / [e]dit / [r]egenerate / [s]kip")
        choice = input("Your choice: ").strip().lower()

        if choice == "a":
            approved_posts.append(post)
            print("✅ Approved!")

        elif choice == "e":
            print("Enter your edited tweet (empty line to finish):")
            lines = []
            while True:
                line = input()
                if line == "":
                    break
                lines.append(line)
            if lines:
                post["tweet"]["tweet_text"] = "\n".join(lines)
                approved_posts.append(post)
                print("✅ Edited and approved!")

        elif choice == "r":
            print("Regenerating...")
            new_tweet = fetcher.generate_tweet(finding, timing)
            post["tweet"] = new_tweet
            print("New tweet:")
            print(new_tweet["tweet_text"])
            confirm = input("Approve this? [y/n]: ").strip().lower()
            if confirm == "y":
                approved_posts.append(post)
                print("✅ Approved!")
            else:
                print("⏭️  Skipped.")

        else:
            print("⏭️  Skipped.")

    print(f"\n{'='*50}")
    print(f"Ready to post: {len(approved_posts)}/3 tweets approved")

    if approved_posts:
        confirm = input("Post now? [y/n]: ").strip().lower()
        if confirm == "y":
            for post in approved_posts:
                results = poster.post_with_thread(post["tweet"])
                for r in results:
                    print(f"✅ Posted: {r['url']}")
        else:
            # Save for later
            with open("approved_posts.json", "w", encoding="utf-8") as f:
                json.dump([p["tweet"] for p in approved_posts], f, ensure_ascii=False, indent=2)
            print("💾 Saved to approved_posts.json for later posting")


if __name__ == "__main__":
    interactive_review()
