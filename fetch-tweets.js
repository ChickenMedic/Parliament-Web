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

const FEEDS_PATH = path.join(__dirname, 'src', 'data', 'feeds.json');
const POLITICIANS_PATH = path.join(__dirname, 'src', 'data', 'politicians.json');
const ROLES_PATH = path.join(__dirname, 'src', 'data', 'roles.json');
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'tweets.json');
const MP_OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'mp_tweets.json');
const PROFILES_PATH = path.join(__dirname, 'src', 'data', 'x_profiles.json');
// User IDs are stable; caching them avoids paying for a lookup on every run.
const ID_CACHE_PATH = path.join(__dirname, 'twitter_user_ids.json');

// The frequent (every-2-hours) run only covers the curated feeds in feeds.json.
// The daily run passes --mps to also sweep MPs with a known X handle, in two
// tiers: front-bench MPs (anyone in roles.json — cabinet, secretaries of
// state, opposition critics) every run, backbenchers on a 7-day rotation so
// each is refreshed weekly. --mps-all forces a full sweep.
const INCLUDE_MPS = process.argv.includes('--mps') || process.argv.includes('--mps-all');
const SWEEP_ALL = process.argv.includes('--mps-all');
const ROTATION_DAYS = 7;
// MP posts older than this are not shown on the site, so don't keep them.
const MP_MAX_AGE_DAYS = 90;

// Stable handle → rotation-slot assignment, matched against the day number.
const rotationSlot = handle => {
  let h = 0;
  for (const c of handle.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % ROTATION_DAYS;
};

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// X rate-limit windows are 15 minutes. Wait one window out at most, with a
// global budget so a long MP sweep can't stall the job for hours.
let rateLimitWaitBudgetMs = 45 * 60 * 1000;
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

// Look up ids + profile images for any handles we haven't seen before, in
// bulk (100 per request) so a full MP sweep costs a handful of lookups.
async function resolveUsers(handles, idCache, profiles) {
  const missing = handles.filter(h => !idCache[h] || !profiles[h]);
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    try {
      const res = await withRateLimit(() =>
        client.v2.usersByUsernames(chunk, { 'user.fields': ['profile_image_url', 'name'] })
      );
      for (const u of res.data || []) {
        // Response usernames are canonically cased; match back case-insensitively.
        const handle = chunk.find(h => h.toLowerCase() === u.username.toLowerCase());
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
      console.error(`❌ Bulk user lookup failed (${chunk.length} handles): ${err.message}`);
    }
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
// tweet id we already have) to only fetch — and pay for — genuinely new posts.
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
  console.log(`🚀 Starting X feed fetch (${INCLUDE_MPS ? 'curated feeds + MP sweep' : 'curated feeds only'})...`);
  const feeds = loadJson(FEEDS_PATH, {});
  const tweetsData = loadJson(OUTPUT_PATH, {});
  const mpTweets = loadJson(MP_OUTPUT_PATH, {});
  const profiles = loadJson(PROFILES_PATH, {});
  const idCache = loadJson(ID_CACHE_PATH, {});

  const mainHandles = Object.keys(feeds);
  const politicians = loadJson(POLITICIANS_PATH, { objects: [] }).objects;
  const roles = loadJson(ROLES_PATH, {});
  const frontbench = new Set(
    politicians.filter(p => roles[p.name] && p.twitter).map(p => p.twitter)
  );
  const daySlot = Math.floor(Date.now() / 86400000) % ROTATION_DAYS;
  const allMpHandles = INCLUDE_MPS
    ? politicians
        .map(p => p.twitter)
        .filter(Boolean)
        .filter(h => !mainHandles.some(m => m.toLowerCase() === h.toLowerCase()))
    : [];
  const mpHandles = allMpHandles.filter(
    h => SWEEP_ALL || frontbench.has(h) || rotationSlot(h) === daySlot
  );
  if (INCLUDE_MPS) {
    console.log(`   MP sweep: ${mpHandles.length} of ${allMpHandles.length} handles today `
      + `(${[...frontbench].filter(h => mpHandles.includes(h)).length} front bench, rotation slot ${daySlot})`);
  }

  await resolveUsers([...mainHandles, ...mpHandles], idCache, profiles);

  let failures = 0;
  for (const handle of mainHandles) {
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
  }

  // Drop handles that were removed from feeds.json.
  for (const handle of Object.keys(tweetsData)) {
    if (!mainHandles.includes(handle)) delete tweetsData[handle];
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tweetsData, null, 2));

  if (INCLUDE_MPS) {
    const cutoff = Date.now() - MP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    let active = 0, done = 0;
    for (const handle of mpHandles) {
      done++;
      if (!idCache[handle]) continue;
      const prev = (mpTweets[handle] || []).filter(t => t.date && new Date(t.date).getTime() >= cutoff);
      const fetched = await fetchTimeline(handle, idCache[handle], {
        maxResults: 5,
        keep: 5,
        sinceId: prev[0]?.id,
      });
      if (fetched === null) continue; // transient failure: keep previous data
      const fresh = fetched.filter(t => t.date && new Date(t.date).getTime() >= cutoff);
      const seen = new Set(fresh.map(t => t.id));
      const merged = [...fresh, ...prev.filter(t => !seen.has(t.id))].slice(0, 5);
      if (merged.length > 0) {
        mpTweets[handle] = merged;
        active++;
      } else {
        // Inactive for 3+ months: the site shouldn't show them at all.
        delete mpTweets[handle];
      }
      if (done % 25 === 0) console.log(`   ...MP sweep ${done}/${mpHandles.length} (${active} active)`);
      await sleep(400);
    }
    // Prune handles no longer in politicians.json — NOT handles merely outside
    // today's rotation slice, whose stored posts must survive between sweeps.
    const validMp = new Set(allMpHandles);
    for (const handle of Object.keys(mpTweets)) {
      if (!validMp.has(handle)) delete mpTweets[handle];
    }
    fs.writeFileSync(MP_OUTPUT_PATH, JSON.stringify(mpTweets, null, 2));
    console.log(`✅ MP sweep complete: ${active} of ${mpHandles.length} MPs posted in the last ${MP_MAX_AGE_DAYS} days`);
  }

  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
  fs.writeFileSync(ID_CACHE_PATH, JSON.stringify(idCache, null, 2));
  console.log(`\n🎉 Done. Saved feed data to ${OUTPUT_PATH} (${failures} handle failures)`);

  // Fail the run only if nothing succeeded, so CI notices a dead token.
  if (failures >= mainHandles.length) process.exit(1);
}

fetchTweets();
