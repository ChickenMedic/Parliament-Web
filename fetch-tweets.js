import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config();

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN || BEARER_TOKEN === 'your_bearer_token_here') {
  console.error("❌ ERROR: TWITTER_BEARER_TOKEN is missing from .env");
  console.error("Please copy .env.example to .env and add your real Bearer Token.");
  process.exit(1);
}

const client = new TwitterApi(BEARER_TOKEN);

// The official party handles we want to fetch
const TARGET_HANDLES = [
  'liberal_party',
  'CPC_HQ',
  'NDP',
  'BlocQuebecois',
  'CanadianGreens',
  'OurCommons'
];

const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'tweets.json');
// User IDs are stable; caching them avoids paying for a lookup on every run.
const ID_CACHE_PATH = path.join(__dirname, 'twitter_user_ids.json');

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function resolveUserId(handle, idCache) {
  if (idCache[handle]) return idCache[handle];
  const user = await client.v2.userByUsername(handle);
  if (!user.data) return null;
  idCache[handle] = user.data.id;
  return user.data.id;
}

// Retweet text comes back truncated ("RT @x: ..."); rebuild it from the
// referenced tweet when the API includes it.
function expandRetweet(tweet, timeline) {
  const ref = (tweet.referenced_tweets || []).find(r => r.type === 'retweeted');
  if (!ref) return tweet.text;
  try {
    const original = timeline.includes?.retweet?.(tweet)
      || timeline.includes?.tweets?.find(t => t.id === ref.id);
    if (!original) return tweet.text;
    const prefixMatch = tweet.text.match(/^RT @\w+: /);
    const prefix = prefixMatch ? prefixMatch[0] : 'RT: ';
    return prefix + original.text;
  } catch {
    return tweet.text;
  }
}

async function fetchTweets() {
  console.log("🚀 Starting Twitter/X feed fetch...");
  const tweetsData = loadJson(OUTPUT_PATH, {});
  const idCache = loadJson(ID_CACHE_PATH, {});
  let failures = 0;

  for (const handle of TARGET_HANDLES) {
    try {
      const userId = await resolveUserId(handle, idCache);
      if (!userId) {
        console.error(`⚠️ Could not find user @${handle}`);
        failures++;
        continue;
      }

      const timeline = await client.v2.userTimeline(userId, {
        max_results: 15,
        exclude: ['replies'],
        'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets'],
        expansions: ['referenced_tweets.id'],
      });

      const fetchedTweets = [];
      for (const tweet of timeline) {
        fetchedTweets.push({
          id: tweet.id,
          content: expandRetweet(tweet, timeline),
          date: tweet.created_at,
          metrics: tweet.public_metrics,
        });
        if (fetchedTweets.length >= 10) break;
      }

      if (fetchedTweets.length > 0) {
        tweetsData[handle] = fetchedTweets;
        console.log(`✅ Fetched ${fetchedTweets.length} posts for @${handle}`);
      } else {
        // Keep whatever we had rather than blanking the feed.
        console.warn(`⚠️ No posts returned for @${handle}; keeping previous data`);
      }
    } catch (err) {
      failures++;
      if (err.code === 403) {
        console.error(`🚨 403 Forbidden for @${handle}: this token's access level can't read timelines.`);
        console.error(`Check your plan at https://developer.x.com — keeping previous data for this handle.`);
      } else if (err.code === 429) {
        console.error(`🚨 429 rate-limited on @${handle}; keeping previous data.`);
      } else {
        console.error(`❌ Error fetching @${handle}:`, err.message);
      }
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tweetsData, null, 2));
  fs.writeFileSync(ID_CACHE_PATH, JSON.stringify(idCache, null, 2));
  console.log(`\n🎉 Done. Saved feed data to ${OUTPUT_PATH} (${failures} handle failures)`);

  // Fail the run only if nothing succeeded, so CI notices a dead token.
  if (failures >= TARGET_HANDLES.length) process.exit(1);
}

fetchTweets();
