"""
Research Fetcher: Fetches latest health research using Claude API
and selects the top 3 findings for posting.
"""

import os
import json
import logging
from datetime import datetime
from anthropic import Anthropic

logger = logging.getLogger(__name__)


RESEARCH_PROMPT = """Today is {date}.

Search and identify the 3 most valuable recent health science findings
(published or discussed in the past 30 days) that meet ALL these criteria:

1. Based on peer-reviewed research OR statements from authoritative institutions
   (NIH, WHO, Harvard, Stanford, Nature, NEJM, Cell, The Lancet, etc.)
2. Practically applicable to daily life
3. Surprising or counter-intuitive (high shareability)
4. Covers a MIX of categories: choose from
   [Nutrition, Sleep, Exercise, Mental Health, Longevity/Anti-aging]

For each finding, provide a JSON response with this exact structure:
{{
  "findings": [
    {{
      "rank": 1,
      "category": "Sleep",
      "headline_jp": "睡眠中にアルツハイマーのリスクを下げる方法が判明",
      "headline_en": "Scientists discover a simple way to reduce Alzheimer's risk during sleep",
      "research_summary_jp": "1-2文で研究内容の超わかりやすい説明（日本語）",
      "research_summary_en": "1-2 sentence plain-English summary of the research",
      "key_stat": "The key number or statistic (e.g., '47% reduction in risk')",
      "practical_actions_jp": ["具体的アクション1", "具体的アクション2", "具体的アクション3"],
      "practical_actions_en": ["Action 1", "Action 2", "Action 3"],
      "source": "Journal/Institution name, Year, DOI or URL if available",
      "relevance_score": 85,
      "timing": "morning"
    }}
  ]
}}

IMPORTANT:
- timing should be: "morning" (habits/nutrition), "noon" (discoveries/surprising facts), or "night" (sleep/mental/recovery)
- relevance_score: 0-100 (novelty 30pts + practicality 25pts + surprise 20pts + credibility 15pts + broad appeal 10pts)
- Only include findings with relevance_score >= 70
- Return valid JSON only, no extra text
"""


TWEET_GENERATION_PROMPT = """Generate a bilingual tweet for this health research finding.

Finding data:
{finding_json}

Post type: {post_type}
Character: Ken 🧬 (friendly scientist, practical, evidence-based, NOT a doctor)

Rules:
1. MUST include both Japanese AND English in the same tweet
2. Always include the source
3. Include 3-5 hashtags (mix of Japanese and English)
4. Include specific data/numbers
5. Include "what to do" practical advice
6. Add appropriate emojis from: 🧬 🔬 📚 💡 ⚡ 🌿 💤 🧠 💪 ⏰ 📊
7. Keep the tone: friendly, smart, NOT alarmist
8. NEVER use: "cure", "treat", "医療", "治療", "診断"
9. Total length: aim for 250-280 characters (use line breaks wisely)

Post type guidelines:
- "morning": Focus on TODAY'S actionable habit. Start with 🌅
- "noon": Focus on the SURPRISING DISCOVERY. Start with ⚡ or 🔬
- "night": Focus on RECOVERY/SLEEP/MENTAL. Start with 🌙

Return JSON:
{{
  "tweet_text": "Full tweet text here (bilingual, with emojis and hashtags)",
  "hashtags": ["tag1", "tag2", "tag3"],
  "thread_continuation": null or "Second tweet for thread if needed"
}}
"""


class ResearchFetcher:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-opus-4-6"

    def fetch_top_findings(self) -> list[dict]:
        """Fetch top 3 health research findings for today."""
        today = datetime.now().strftime("%Y年%m月%d日 (%A)")
        prompt = RESEARCH_PROMPT.format(date=today)

        logger.info("Fetching latest health research via Claude API...")

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.content[0].text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        data = json.loads(raw)
        findings = data.get("findings", [])

        # Sort by relevance score, take top 3
        findings.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        top3 = findings[:3]

        # Assign timings if not set
        timings = ["morning", "noon", "night"]
        for i, finding in enumerate(top3):
            if not finding.get("timing"):
                finding["timing"] = timings[i]

        logger.info(f"Selected {len(top3)} findings: {[f['category'] for f in top3]}")
        return top3

    def generate_tweet(self, finding: dict, post_type: str) -> dict:
        """Generate a bilingual tweet for a research finding."""
        prompt = TWEET_GENERATION_PROMPT.format(
            finding_json=json.dumps(finding, ensure_ascii=False, indent=2),
            post_type=post_type
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        return json.loads(raw)

    def prepare_daily_posts(self) -> list[dict]:
        """Prepare all 3 posts for the day."""
        findings = self.fetch_top_findings()
        posts = []

        for finding in findings:
            timing = finding.get("timing", "noon")
            tweet_data = self.generate_tweet(finding, timing)
            posts.append({
                "timing": timing,
                "finding": finding,
                "tweet": tweet_data,
                "scheduled_for": self._get_schedule_time(timing)
            })

        return posts

    def _get_schedule_time(self, timing: str) -> str:
        today = datetime.now().strftime("%Y-%m-%d")
        hour_map = {
            "morning": os.getenv("MORNING_HOUR_JST", "7"),
            "noon": os.getenv("NOON_HOUR_JST", "12"),
            "night": os.getenv("NIGHT_HOUR_JST", "21")
        }
        hour = hour_map.get(timing, "12")
        return f"{today} {hour}:00 JST"
