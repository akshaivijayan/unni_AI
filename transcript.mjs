import { YoutubeTranscript } from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";

async function getTranscript(url) {
  try {
    const items = await YoutubeTranscript.fetchTranscript(url, { lang: "en" });
    const text = items.map((i) => i.text).join(" ");
    console.log(text);
  } catch (err) {
    console.error("Failed to fetch transcript.");
    if (err?.name === "YoutubeTranscriptNotAvailableLanguageError") {
      console.error("English transcript not available for this video.");
      if (Array.isArray(err?.availableLangs)) {
        console.error("Available languages:", err.availableLangs.join(", "));
      }
    } else if (err?.name === "YoutubeTranscriptDisabledError") {
      console.error("Transcripts are disabled for this video.");
    } else if (err?.name === "YoutubeTranscriptTooManyRequestError") {
      console.error("YouTube is rate-limiting requests from this IP (captcha required).");
    } else if (err?.name === "YoutubeTranscriptVideoUnavailableError") {
      console.error("Video is unavailable.");
    } else if (err?.name === "YoutubeTranscriptNotAvailableError") {
      console.error("No transcripts are available for this video.");
    } else {
      console.error("Reason:", err?.message || err);
    }
    process.exitCode = 1;
  }
}

const url = process.argv[2];
if (!url) {
  console.error("Usage: node transcript.mjs <youtube-url>");
  process.exit(1);
}

getTranscript(url);
