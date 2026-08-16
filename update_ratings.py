"""Propose fresh approval-rating entries for src/data/leaders.json.

Approval numbers have no free API, so this uses Claude with web search to
check the major Canadian pollsters (Angus Reid, Léger, Abacus, Nanos, ...)
for numbers newer than what the file currently holds. Only the "ratings"
arrays are touched; bios and titles stay as-is. The CI workflow opens a
pull request so a human verifies each figure against its source URL before
it goes live.

Run: ANTHROPIC_API_KEY=... python update_ratings.py
"""

import json
import sys

import anthropic

LEADERS = 'src/data/leaders.json'
MODEL = 'claude-opus-5'

RATING = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "pollster": {"type": "string"},
            "value": {"type": "string"},
            "metric": {"type": "string"},
            "detail": {"type": "string"},
            "date": {"type": "string"},
            "url": {"type": "string"},
            "tone": {"type": "string", "enum": ["positive", "neutral", "negative"]},
        },
        "required": ["pollster", "value", "metric", "detail", "date", "url", "tone"],
        "additionalProperties": False,
    },
}

SCHEMA = {
    "type": "object",
    "properties": {"pm_ratings": RATING, "opposition_ratings": RATING},
    "required": ["pm_ratings", "opposition_ratings"],
    "additionalProperties": False,
}

PROMPT = """You maintain the approval-rating cards for a factual Canadian \
politics website. The current data for the Prime Minister ({pm}) and the \
Leader of the Official Opposition ({opp}) is below.

Search the web for the latest published approval/favourability numbers for \
each leader from reputable Canadian pollsters (Angus Reid Institute, Léger, \
Abacus Data, Nanos Research, Ipsos, Pollara). Rules:
- Return 3 entries per leader, newest available figures first.
- Only include a figure you actually found in a search result, with the \
pollster's own page or a reputable news article as "url". Never invent \
numbers, dates, or URLs.
- "value" is the headline percentage (e.g. "55%"); "metric" names what it \
measures; "detail" is one short factual note; "date" is the poll's field or \
publication date; "tone" reflects whether the number is good, mixed, or bad \
for that leader.
- If you find nothing newer than the current data for a pollster, keep the \
current entry for it unchanged.

CURRENT DATA:
{data}
"""


def main():
    with open(LEADERS, encoding='utf-8') as f:
        leaders = json.load(f)

    client = anthropic.Anthropic()
    messages = [{
        "role": "user",
        "content": PROMPT.format(
            pm=leaders['pm']['name'],
            opp=leaders['opposition']['name'],
            data=json.dumps(
                {"pm_ratings": leaders['pm']['ratings'],
                 "opposition_ratings": leaders['opposition']['ratings']},
                indent=1, ensure_ascii=False),
        ),
    }]

    while True:
        response = client.beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 8}],
            output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
            messages=messages,
        )
        if response.stop_reason == "pause_turn":
            # Server-side tool loop paused; re-send to let it resume.
            messages = [messages[0], {"role": "assistant", "content": response.content}]
            continue
        break

    if response.stop_reason == "refusal":
        print("Model declined the request; leaving leaders.json unchanged.")
        return
    if response.stop_reason == "max_tokens":
        print("Output truncated; leaving leaders.json unchanged.", file=sys.stderr)
        sys.exit(1)

    text = next(b.text for b in response.content if b.type == "text")
    ratings = json.loads(text)

    if (ratings["pm_ratings"] == leaders['pm']['ratings']
            and ratings["opposition_ratings"] == leaders['opposition']['ratings']):
        print("No changes proposed.")
        return

    leaders['pm']['ratings'] = ratings["pm_ratings"]
    leaders['opposition']['ratings'] = ratings["opposition_ratings"]
    with open(LEADERS, 'w', encoding='utf-8') as f:
        json.dump(leaders, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f"Updated ratings in {LEADERS}.")


if __name__ == '__main__':
    main()
