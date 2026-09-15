import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse json with large limit for image data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy/safe initialization helper for GoogleGenAI
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    appName: "SandY Chat",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Available models
app.get("/api/models", (_req: Request, res: Response) => {
  res.json({
    models: [
      {
        id: "gemini-3.8-flash",
        name: "SandY Flash 3.8",
        description: "Intelligent, fast, and creative with full multimodal capabilities",
        tag: "Recommended",
        icon: "sparkles",
      },
      {
        id: "gemini-3.1-flash-lite",
        name: "SandY Flash Lite",
        description: "Optimized for lightning-fast latency and concise answers",
        tag: "Speed",
        icon: "zap",
      },
    ],
  });
});

function parseGeminiErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";
  let msg = typeof error === "string" ? error : error.message || String(error);

  // Parse nested JSON if Gemini SDK throws stringified JSON response
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      msg = parsed.error.message;
    }
  } catch {
    const match = msg.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const inner = JSON.parse(match[0]);
        if (inner.error?.message) {
          msg = inner.error.message;
        }
      } catch {}
    }
  }

  // Friendly explanations for common error codes
  if (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("Service Unavailable")
  ) {
    return "Gemini service is currently experiencing temporary high traffic. We automatically tried backup models, but servers are still recovering. Please retry in a few moments or switch to SandY Flash Lite.";
  }

  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Rate limit exceeded. Please pause for a few seconds before sending another message.";
  }

  return msg;
}

// Streaming Chat API Endpoint with Resilient Multi-Model Fallback
app.post("/api/chat/stream", async (req: Request, res: Response) => {
  const {
    messages,
    model = "gemini-3.1-flash-lite",
    systemInstruction,
    webSearch = false,
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid or empty messages payload" });
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const ai = getGenAI();

    // Map conversation messages to GenAI contents structure
    const contents = messages.map((msg: any) => {
      const role = msg.role === "assistant" ? "model" : "user";
      const parts: any[] = [];

      // If image inline data is attached
      if (msg.image && msg.image.data && msg.image.mimeType) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: msg.image.data,
          },
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      } else if (parts.length === 0) {
        parts.push({ text: " " });
      }

      return {
        role,
        parts,
      };
    });

    // Question-Based Answer Directive: Ensure SandY answers questions with 100% precision, structure, and directness
    const questionAnsweringDirective = [
      "CRITICAL DIRECTIVE - HIGH-PRECISION QUESTION-BASED ANSWERING:",
      "1. DIRECT CONCLUSION / ANSWER FIRST: Address the exact core of the user's question right away in the first sentence or bullet point. Do not stall or use conversational filler ('Sure thing!', 'That is a great question', 'As an AI...').",
      "2. ADDRESS ALL PARTS: If the user's inquiry has multiple questions, sub-parts, or implicit constraints, organize and answer each distinct part clearly using structured headings or bullet points.",
      "3. HIGH ACCURACY & CONCRETE EVIDENCE: Provide exact formulas, validated code snippets, real-world examples, or step-by-step logic that directly solves the question.",
      "4. ZERO UNNECESSARY INTRODUCTIONS: Never introduce yourself or say 'I am SandY...' unless specifically asked 'Who are you?' or 'What is your name?'.",
      "5. LANGUAGE MIRRORING: If the question is asked in Hindi or Hinglish, answer in natural, fluent Hindi/Hinglish. If in English, answer in refined, professional English.",
    ].join("\n");

    const baseInstruction =
      systemInstruction ||
      "You are SandY Intelligence, a high-precision AI assistant. You deliver comprehensive, perfectly structured, question-centric answers with beautiful Markdown formatting, syntax-highlighted code blocks, and crisp bullet points.";

    const fullSystemInstruction = `${baseInstruction}\n\n${questionAnsweringDirective}`;

    // Determine sequence of attempts:
    // If a model or tool encounters 503 / 429 quota, fallback smoothly!
    const preferredModel = model || "gemini-3.1-flash-lite";
    const modelOrder =
      preferredModel === "gemini-3.1-flash-lite"
        ? ["gemini-3.1-flash-lite", "gemini-3.8-flash"]
        : [preferredModel, "gemini-3.1-flash-lite"];

    const attempts: Array<{ modelName: string; useSearch: boolean }> = [];
    for (const m of modelOrder) {
      if (webSearch) {
        attempts.push({ modelName: m, useSearch: true });
      }
      attempts.push({ modelName: m, useSearch: false });
    }

    let streamSuccess = false;
    let lastError: any = null;

    for (let i = 0; i < attempts.length; i++) {
      const { modelName, useSearch } = attempts[i];
      let emittedAnyChunk = false;

      const activeConfig: Record<string, any> = {
        systemInstruction: fullSystemInstruction,
      };

      if (useSearch) {
        activeConfig.tools = [{ googleSearch: {} }];
      }

      // Retry transient spikes: 1 quick retry for flash-lite, 0 delay for 3.8-flash so it switches immediately to flash-lite
      const maxRetries = modelName === "gemini-3.1-flash-lite" ? 1 : 0;
      for (let retry = 0; retry <= maxRetries; retry++) {
        try {
          console.log(
            `[SandY Chat] Attempting stream with ${modelName} (search: ${useSearch}, try: ${retry + 1})...`
          );
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config: activeConfig,
          });

          let aggregatedGrounding: any[] = [];

          for await (const chunk of responseStream) {
            emittedAnyChunk = true;
            const text = chunk.text || "";

            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
              const gm = chunk.candidates[0].groundingMetadata;
              if (gm.groundingChunks && Array.isArray(gm.groundingChunks)) {
                aggregatedGrounding = gm.groundingChunks;
              }
            }

            const payload = {
              text,
              modelUsed: modelName,
              groundingSources: aggregatedGrounding
                .map((g: any) => ({
                  title: g.web?.title || g.web?.uri || "Web Source",
                  url: g.web?.uri || "",
                }))
                .filter((s: any) => s.url),
            };

            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          }

          // Successfully completed streaming!
          streamSuccess = true;
          res.write(`data: ${JSON.stringify({ done: true, modelUsed: modelName })}\n\n`);
          res.end();
          break; // break out of retry loop
        } catch (err: any) {
          lastError = err;
          const parsedMsg = parseGeminiErrorMessage(err);
          console.warn(
            `[SandY Chat] ${modelName} (search: ${useSearch}, try: ${retry + 1}) failed: ${parsedMsg}`
          );

          // If tokens were already sent to client, we cannot restart stream mid-way
          if (emittedAnyChunk) {
            break;
          }

          // If this was not the last retry, wait briefly and retry this model
          if (retry < maxRetries) {
            const backoffMs = 500;
            console.log(`[SandY Chat] Waiting ${backoffMs}ms before retrying ${modelName}...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
        }
      }

      if (streamSuccess || emittedAnyChunk) {
        break; // break out of attempts loop
      }

      // If another model attempt is available, switch to it
      if (i < attempts.length - 1) {
        const next = attempts[i + 1];
        console.log(
          `[SandY Chat] Switching to next candidate attempt: ${next.modelName} (search: ${next.useSearch})`
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    if (!streamSuccess) {
      const cleanMsg = parseGeminiErrorMessage(lastError);
      res.write(`data: ${JSON.stringify({ error: cleanMsg })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("Gemini Streaming Uncaught Error:", error);
    const cleanMsg = parseGeminiErrorMessage(error);
    res.write(`data: ${JSON.stringify({ error: cleanMsg })}\n\n`);
    res.end();
  }
});

// Image Generation and Editing Endpoint (gemini-3.1-flash-image)
app.post("/api/image/generate", async (req: Request, res: Response) => {
  const { prompt, image, aspectRatio = "1:1" } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A prompt is required for image creation or editing." });
  }

  try {
    const ai = getGenAI();
    const parts: any[] = [];

    // If an image was provided, add it for image editing
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    parts.push({ text: prompt.trim() });

    const config: Record<string, any> = {
      imageConfig: {
        aspectRatio: ["1:1", "16:9", "9:16", "4:3", "3:4"].includes(aspectRatio)
          ? aspectRatio
          : "1:1",
      },
    };

    // Try primary image model, fallback to lite image model if 503/high demand
    const imageModelsToTry = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"];
    let response: any = null;
    let usedModel = "gemini-3.1-flash-image";
    let lastImgErr: any = null;

    for (const m of imageModelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents: { parts },
          config,
        });
        usedModel = m;
        break;
      } catch (err: any) {
        lastImgErr = err;
        console.warn(`[SandY Chat] Image model ${m} failed: ${err.message}. Trying next...`);
      }
    }

    if (!response) {
      throw lastImgErr || new Error("Failed to generate image.");
    }

    let imageUrl = "";
    let responseText = "";

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        responseText += part.text;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: "The model responded without an image. Please try a different prompt.",
        details: responseText,
      });
    }

    res.json({
      success: true,
      imageUrl,
      text: responseText,
      prompt: prompt.trim(),
      isEdit: Boolean(image),
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate or edit image.",
    });
  }
});

// Setup Vite or Static File Serving
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SandY Chat server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  initServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
export { app };
