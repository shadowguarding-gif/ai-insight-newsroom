/*
  Framework-neutral server example.
  Adapt `handleSummaryRequest` to your platform of choice
  (Vercel, Netlify Functions, Cloudflare Workers, Express, Fastify, etc.).

  Expected request body:
  {
    "provider": "local" | "openai" | "deepseek",
    "model": "local-brief" | "local-expanded" | "gpt-5.4-mini" | "gpt-5.4-nano" | "deepseek-chat" | "deepseek-reasoner",
    "language": "zh" | "en",
    "story": {
      "title": "...",
      "deck": "...",
      "content": ["...", "..."],
      "sourceUrl": "...",
      "sourceName": "...",
      "date": "YYYY-MM-DD",
      "category": "models"
    }
  }
*/

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function buildPrompt(language, story) {
  const isChinese = language === "zh";
  const paragraphs = Array.isArray(story.content) ? story.content.join("\n\n") : story.content || "";

  return isChinese
    ? `你是一个全球 AI 新闻编辑。请基于以下材料，输出一段 90 到 140 字的中文摘要。

要求：
1. 不要夸张，不要营销化。
2. 优先说明这条新闻发生了什么、为什么重要。
3. 如果有原文来源，请保持与来源一致，不编造信息。
4. 输出只要摘要正文，不要标题，不要项目符号。

标题：${story.title}
导语：${story.deck}
来源：${story.sourceName || ""}
日期：${story.date || ""}
原文地址：${story.sourceUrl || ""}

正文：
${paragraphs}`
    : `You are an editor for a global AI news product. Write a 60 to 90 word English summary from the material below.

Requirements:
1. Stay factual and non-promotional.
2. Explain what happened and why it matters.
3. If a source link exists, stay consistent with source-backed information.
4. Return summary text only, with no title and no bullets.

Title: ${story.title}
Deck: ${story.deck}
Source: ${story.sourceName || ""}
Date: ${story.date || ""}
Source URL: ${story.sourceUrl || ""}

Body:
${paragraphs}`;
}

function normalizeSummaryText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;:!?])\s*/g, "$1 ")
    .trim();
}

function clampSummaryText(value, maxLength) {
  const text = normalizeSummaryText(value);

  if (!text || text.length <= maxLength) {
    return text;
  }

  const shortened = text.slice(0, Math.max(0, maxLength - 1)).trim();
  const trimmed = shortened.replace(/[,:;，；、\s]+$/g, "");
  return `${trimmed}...`;
}

function uniqueStrings(values) {
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map(normalizeSummaryText)
    .filter((value) => {
      if (!value || seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    });
}

function buildLocalSummary(language, story, model) {
  const isChinese = language === "zh";
  const content = Array.isArray(story.content) ? story.content : [story.content];
  const deck = normalizeSummaryText(story.deck);
  const contentFragments = uniqueStrings(content).map((item) => clampSummaryText(item, isChinese ? 52 : 110));
  const primary = deck || contentFragments[0] || normalizeSummaryText(story.title);
  const secondary = contentFragments.filter((item) => item && item !== primary).slice(0, model === "local-expanded" ? 2 : 1);
  const sourceLead = normalizeSummaryText(story.sourceName);

  if (isChinese) {
    const lead = sourceLead ? `这条更新来自${sourceLead}。` : "";
    const focus = secondary.length ? `重点包括：${secondary.join("；")}。` : "";
    return clampSummaryText(`${lead}${primary}${/[。！？]$/.test(primary) ? "" : "。"}${focus}`, 140);
  }

  const lead = sourceLead ? `From ${sourceLead}, ` : "";
  const focus = secondary.length ? ` Key details: ${secondary.join("; ")}.` : "";
  return clampSummaryText(`${lead}${primary}${/[.!?]$/.test(primary) ? "" : "."}${focus}`, 240);
}

async function summarizeWithOpenAI(model, prompt) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}`);
  }

  const payload = await response.json();
  return payload.output_text || "";
}

async function summarizeWithDeepSeek(model, prompt) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a precise AI news editor. Return only the requested summary."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek error ${response.status}`);
  }

  const payload = await response.json();
  return payload.choices && payload.choices[0] && payload.choices[0].message
    ? payload.choices[0].message.content
    : "";
}

export async function handleSummaryRequest(request) {
  if (request.method === "OPTIONS") {
    return json({}, 200);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await request.json();
    let provider = body.provider === "deepseek" || body.provider === "local" ? body.provider : "openai";
    const language = body.language === "en" ? "en" : "zh";
    const story = body.story || {};
    const prompt = buildPrompt(language, story);

    let summary = "";
    let model = body.model || null;

    if (provider === "local") {
      model = body.model || "local-brief";
      summary = buildLocalSummary(language, story, model);
    } else if (provider === "deepseek") {
      if (!process.env.DEEPSEEK_API_KEY) {
        provider = "local";
        model = "local-brief";
        summary = buildLocalSummary(language, story, model);
      } else {
        model = body.model || "deepseek-chat";
        summary = await summarizeWithDeepSeek(model, prompt);
      }
    } else {
      if (!process.env.OPENAI_API_KEY) {
        provider = "local";
        model = "local-brief";
        summary = buildLocalSummary(language, story, model);
      } else {
        model = body.model || "gpt-5.4-mini";
        summary = await summarizeWithOpenAI(model, prompt);
      }
    }

    return json({
      summary: String(summary || "").trim(),
      provider,
      model
    });
  } catch (error) {
    return json(
      {
        error: "summary_generation_failed",
        detail: error.message
      },
      500
    );
  }
}
