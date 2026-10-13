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

// The handles in feeds.json are the only ones fetched: the five parties, the
// House of Commons, the Prime Minister and the Leader of the Opposition. Their
// latest posts appear on the Parties page and the two leader pages. The site
// used to sweep every MP's timeline for a merged feed; that was dropped to
// keep X API spend to a handful of reads a day. MPs' X profiles are linked
// from Find Your MP instead.
const FEEDS_PATH = path.join(__dirname, 'src', 'data', 'feeds.json');
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'tweets.json');
const PROFILES_PATH = path.join(__dirname, 'src', 'data', 'x_profiles.json');
// User IDs are stable; caching them avoids paying for a lookup on every run.
const ID_CACHE_PATH = path.join(__dirname, 'twitter_user_ids.json');

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// X rate-limit windows are 15 minutes. Wait one window out at most.
let rateLimitWaitBudgetMs = 20 * 60 * 1000;
async function withRateLimit(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code !== 429) throw err;
    const resetMs = err.rateLimit?.reset
      ? Math.max(err.rateLimit.reset * 1000 - Date.now(), 5000)
      : 15 * 60 * 1000;
    if (resetMs > rateLimitWaitBudgetMs) throw err;
    rateLimitWaitBudgetMs -= resetMs;
    console.warn(`⏳ 429 rate-limited; waiting ${Math.ceil(resetMs / 1000)}s for the window to reset...`);
    await sleep(resetMs + 2000);
    return fn();
  }
}

// Look up ids + profile images for any handles we haven't seen before.
async function resolveUsers(handles, idCache, profiles) {
  const missing = handles.filter(h => !idCache[h] || !profiles[h]);
  if (missing.length === 0) return;
  try {
    const res = await withRateLimit(() =>
      client.v2.usersByUsernames(missing, { 'user.fields': ['profile_image_url', 'name'] })
    );
    for (const u of res.data || []) {
      // Response usernames are canonically cased; match back case-insensitively.
      const handle = missing.find(h => h.toLowerCase() === u.username.toLowerCase());
      if (!handle) continue;
      idCache[handle] = u.id;
      profiles[handle] = {
        name: u.name,
        image: u.profile_image_url ? u.profile_image_url.replace('_normal', '_400x400') : null,
      };
    }
    for (const e of res.errors || []) {
      console.warn(`⚠️ Could not resolve @${e.value || '?'}: ${e.detail || e.title}`);
    }
  } catch (err) {
    console.error(`❌ User lookup failed (${missing.length} handles): ${err.message}`);
  }
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

// Returns an array of simplified tweets, or null on failure.
// Pay-per-use billing charges per post read, so pass sinceId (the newest
// tweet id we already have) to only fetch, and pay for, genuinely new posts.
async function fetchTimeline(handle, userId, { maxResults, keep, sinceId }) {
  try {
    const timeline = await withRateLimit(() =>
      client.v2.userTimeline(userId, {
        max_results: maxResults,
        exclude: ['replies'],
        'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets'],
        expansions: ['referenced_tweets.id'],
        ...(sinceId ? { since_id: sinceId } : {}),
      })
    );

    const fetchedTweets = [];
    for (const tweet of timeline) {
      fetchedTweets.push({
        id: tweet.id,
        content: expandRetweet(tweet, timeline),
        date: tweet.created_at,
        metrics: tweet.public_metrics,
      });
      if (fetchedTweets.length >= keep) break;
    }
    return fetchedTweets;
  } catch (err) {
    if (err.code === 402) {
      // Every request fails the same way until the account is topped up, so
      // there's no point trying the rest of the list.
      console.error('🚨 402 Payment Required: the X developer account has no API credits. '
        + 'Top up at https://developer.x.com/ (Pay-per-use) and re-run. Keeping previous data.');
      process.exit(2);
    }
    if (err.code === 403) {
      console.error(`🚨 403 Forbidden for @${handle}: this token's access level can't read timelines.`);
    } else if (err.code === 429) {
      console.error(`🚨 429 rate-limited on @${handle} (wait budget exhausted); keeping previous data.`);
    } else {
      console.error(`❌ Error fetching @${handle}: ${err.message}`);
    }
    return null;
  }
}

async function fetchTweets() {
  const feeds = loadJson(FEEDS_PATH, {});
  const tweetsData = loadJson(OUTPUT_PATH, {});
  const profiles = loadJson(PROFILES_PATH, {});
  const idCache = loadJson(ID_CACHE_PATH, {});

  const handles = Object.keys(feeds);
  console.log(`🚀 Fetching the latest posts for ${handles.length} handles...`);

  await resolveUsers(handles, idCache, profiles);

  let failures = 0;
  for (const handle of handles) {
    if (!idCache[handle]) {
      console.error(`⚠️ No user id for @${handle}; skipping`);
      failures++;
      continue;
    }
    // Stored posts are newest-first; only fetch (and pay for) newer ones.
    const prev = tweetsData[handle] || [];
    const fetched = await fetchTimeline(handle, idCache[handle], {
      maxResults: 15,
      keep: 10,
      sinceId: prev[0]?.id,
    });
    if (fetched === null) {
      // Keep whatever we had rather than blanking the feed.
      failures++;
      console.warn(`⚠️ Fetch failed for @${handle}; keeping previous data`);
    } else if (fetched.length === 0) {
      console.log(`✅ No new posts for @${handle}`);
    } else {
      const seen = new Set(fetched.map(t => t.id));
      tweetsData[handle] = [...fetched, ...prev.filter(t => !seen.has(t.id))].slice(0, 10);
      console.log(`✅ Fetched ${fetched.length} new posts for @${handle}`);
    }
    await sleep(300);
  }

  // Drop handles that were removed from feeds.json.
  for (const handle of Object.keys(tweetsData)) {
    if (!handles.includes(handle)) delete tweetsData[handle];
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tweetsData, null, 2));
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
  fs.writeFileSync(ID_CACHE_PATH, JSON.stringify(idCache, null, 2));
  console.log(`\n🎉 Done. Saved feed data to ${OUTPUT_PATH} (${failures} handle failures)`);

  // Fail the run only if nothing succeeded, so CI notices a dead token.
  if (failures >= handles.length) process.exit(1);
}

fetchTweets();
