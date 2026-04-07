import { google } from "googleapis";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: node get-gmail-token.js <CLIENT_ID> <CLIENT_SECRET>");
  console.error("Get these from your Google Cloud console credentials JSON");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log("\n🔗 Visit this URL to authorize the app:\n");
console.log(authUrl);
console.log(
  "\nAfter authorizing, you'll see a redirect error. Copy the 'code' parameter from the URL.\n",
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Paste the authorization code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n✅ Success! Here's your refresh token:\n");
    console.log("GMAIL_REFRESH_TOKEN =", tokens.refresh_token);
    console.log("\nAlso update your .env with:");
    console.log("GMAIL_CLIENT_ID =", CLIENT_ID);
    console.log("GMAIL_CLIENT_SECRET =", CLIENT_SECRET);
    rl.close();
  } catch (err) {
    console.error("❌ Error getting token:", err.message);
    rl.close();
    process.exit(1);
  }
});
