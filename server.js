const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const loadEnv = () => {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  });
};

loadEnv();

const PORT = process.env.PORT || 3000;
const INDEX_PATH = path.join(__dirname, "index.html");
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct";

const getTranscript = async (videoUrl) => {
  const { YoutubeTranscript } = await import(
    "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js"
  );
  const items = await YoutubeTranscript.fetchTranscript(videoUrl, { lang: "en" });
  return items.map((item) => item.text).join(" ");
};

const buildStudyPrompt = (transcript) => [
  {
    role: "system",
    content:
      "You are an excellent student and expert note-taker. Return clean, structured study output in JSON.",
  },
  {
    role: "user",
    content:
      "Given the transcript below, return a JSON object with exactly two keys:\n" +
      "summary: an array of 5-7 bullet strings, one sentence each.\n" +
      "notes: a single string of expert student notes with headings and bullets.\n" +
      "Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n" +
      "Transcript:\n" +
      transcript,
  },
];

const callHuggingFace = async (prompt) => {
  if (!HF_API_KEY) {
    const err = new Error("Missing HF_API_KEY on the server.");
    err.statusCode = 500;
    throw err;
  }

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.2,
          max_new_tokens: 1400,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || "Hugging Face request failed.");
    err.statusCode = response.status;
    throw err;
  }

  const payload = await response.json();
  if (Array.isArray(payload) && payload[0]?.generated_text) {
    return payload[0].generated_text;
  }
  if (payload?.generated_text) {
    return payload.generated_text;
  }
  if (payload?.error) {
    const err = new Error(payload.error);
    err.statusCode = 500;
    throw err;
  }
  return "";
};

const parseStudyOutput = (content) => {
  const cleaned = content.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const summaryArr = Array.isArray(parsed.summary) ? parsed.summary : [];
    const summary = summaryArr.length ? summaryArr.map((item) => `- ${item}`).join("\n") : "";
    const notes = typeof parsed.notes === "string" ? parsed.notes.trim() : "";
    return { summary, notes };
  } catch (err) {
    const summaryMatch = content.match(/SUMMARY:\s*([\s\S]*?)\nAI_NOTES:/i);
    const notesMatch = content.match(/AI_NOTES:\s*([\s\S]*)/i);
    const summary = summaryMatch?.[1]?.trim() || "";
    const notes = notesMatch?.[1]?.trim() || "";
    return { summary, notes };
  }
};

const buildError = (err) => {
  if (err?.name === "YoutubeTranscriptNotAvailableLanguageError") {
    return {
      status: 404,
      message: "No English transcript available for this video.",
    };
  }
  if (err?.name === "YoutubeTranscriptDisabledError") {
    return { status: 403, message: "Transcripts are disabled for this video." };
  }
  if (err?.name === "YoutubeTranscriptTooManyRequestError") {
    return { status: 429, message: "YouTube is rate-limiting this IP (captcha required)." };
  }
  if (err?.name === "YoutubeTranscriptVideoUnavailableError") {
    return { status: 404, message: "Video is unavailable." };
  }
  if (err?.name === "YoutubeTranscriptNotAvailableError") {
    return { status: 404, message: "No transcripts are available for this video." };
  }
  return { status: 500, message: err?.message || "Failed to fetch transcript." };
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/" && req.method === "GET") {
    fs.readFile(INDEX_PATH, "utf8", (err, html) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Unable to load index.html");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    return;
  }

  if (requestUrl.pathname === "/api/transcript" && req.method === "GET") {
    const videoUrl = requestUrl.searchParams.get("url");
    if (!videoUrl) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing url parameter." }));
      return;
    }

    try {
      const text = await getTranscript(videoUrl);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ text, lang: "en" }));
    } catch (err) {
      const failure = buildError(err);
      res.writeHead(failure.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: failure.message }));
    }
    return;
  }

  if (requestUrl.pathname === "/api/analyze" && req.method === "GET") {
    const videoUrl = requestUrl.searchParams.get("url");
    if (!videoUrl) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing url parameter." }));
      return;
    }

    try {
      const transcript = await getTranscript(videoUrl);
      try {
        const prompt = buildStudyPrompt(transcript)
          .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
          .join("\n\n");
        const content = await callHuggingFace(prompt);
        const { summary, notes } = parseStudyOutput(content);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            transcript,
            summary: summary || "Summary unavailable.",
            notes: notes || content || "Notes unavailable.",
            model: HF_MODEL,
          })
        );
      } catch (err) {
        const message = err?.message || "Hugging Face request failed.";
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            transcript,
            summary: `Summary unavailable. ${message}`,
            notes: `Notes unavailable. ${message}`,
            model: HF_MODEL,
            llm_error: message,
          })
        );
      }
    } catch (err) {
      const failure = buildError(err);
      res.writeHead(failure.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: failure.message }));
    }
    return;
  }

  if (requestUrl.pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Unni AI server running at http://localhost:${PORT}`);
});
