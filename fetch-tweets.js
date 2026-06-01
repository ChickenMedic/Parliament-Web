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

async function fetchTweets() {
  console.log("🚀 Starting Twitter/X feed fetch...");
  const tweetsData = {};

  try {
    for (const handle of TARGET_HANDLES) {
      console.log(`\n🔍 Fetching user info for @${handle}...`);
      
      try {
        const user = await client.v2.userByUsername(handle);
        if (!user.data) {
          console.error(`⚠️ Could not find user @${handle}`);
          continue;
        }

        const userId = user.data.id;
        console.log(`✅ Found @${handle} (ID: ${userId}). Fetching timeline...`);

        // Fetch the user's timeline
        const timeline = await client.v2.userTimeline(userId, {
          max_results: 10,
          exclude: ['retweets', 'replies'],
          'tweet.fields': ['created_at', 'public_metrics']
        });

        const fetchedTweets = [];
        for (const tweet of timeline) {
          fetchedTweets.push({
            id: tweet.id,
            content: tweet.text,
            date: tweet.created_at,
            metrics: tweet.public_metrics
          });
        }

        tweetsData[handle] = fetchedTweets;
        console.log(`✅ Successfully fetched ${fetchedTweets.length} tweets for @${handle}`);
        
      } catch (err) {
        if (err.code === 403) {
          console.error(`\n🚨 FATAL ERROR (403 Forbidden) 🚨`);
          console.error(`Your X API Bearer Token does not have access to read timelines.`);
          console.error(`This happens because the Free Tier ($0/mo) strictly forbids reading tweets. It only allows posting tweets.`);
          console.error(`To use this script, you must upgrade your developer account to the Basic Tier ($100/mo).`);
          process.exit(1);
        } else {
          console.error(`❌ Error fetching @${handle}:`, err.message);
        }
      }
    }

    // Save to src/data/tweets.json
    const outputPath = path.join(__dirname, 'src', 'data', 'tweets.json');
    fs.writeFileSync(outputPath, JSON.stringify(tweetsData, null, 2));
    
    console.log(`\n🎉 All done! Saved feed data to ${outputPath}`);

  } catch (globalErr) {
    console.error("❌ Global script failure:", globalErr);
  }
}

fetchTweets();
