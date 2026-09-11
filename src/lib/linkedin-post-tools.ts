import "server-only";

import Groq from "groq-sdk";
import { resolveGroqApiKey } from "@/lib/app-settings";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";
import {
  HUMAN_VOICE_RULES,
  auditPostBody,
  resolveLengthSpec,
  sanitizeBody,
} from "@/lib/linkedin-style-guide";
import type {
  CarouselSlide,
  PostAudience,
  PostLength,
  PostTemplate,
  RewriteAction,
} from "@/lib/admin-types";
import { suggestHashtags } from "@/lib/linkedin-hashtags";

const REWRITE_GUIDANCE: Record<Exclude<RewriteAction, "custom">, string> = {
  sharper_hook:
    "Replace the opening with a more specific, curiosity-building hook. Preserve the argument.",
  simpler:
    "Use shorter sentences and everyday words. Remove jargon without dumbing down the idea.",
  more_technical:
    "Add useful implementation detail and trade-offs. Do not invent tools, numbers, or experience.",
  more_personal:
    "Bring forward the writer's decision, mistake, observation, or uncertainty. Do not fabricate a story.",
  shorter:
    "Cut at least 25%. Remove setup, repeated claims, and the summary. Preserve the strongest detail.",
};

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function getGroq(): Promise<Groq> {
  const apiKey = await resolveGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "Groq API key is not configured. Add it in Admin → Settings.",
    );
  }
  return new Groq({ apiKey });
}

export async function rewriteLinkedInPost(input: {
  body: string;
  action: RewriteAction;
  customInstruction?: string;
  length?: PostLength;
  customWordCount?: number | null;
  audience?: PostAudience;
}): Promise<{
  hook: string;
  body: string;
  alternativeHooks: string[];
  qualityIssues: string[];
}> {
  const groq = await getGroq();
  const requestedSpec = resolveLengthSpec(
    input.length ?? "medium",
    input.customWordCount ?? undefined,
  );
  const currentWords = input.body.trim().split(/\s+/).length;
  const spec =
    input.action === "shorter"
      ? {
          ...requestedSpec,
          minWords: Math.max(30, Math.round(currentWords * 0.55)),
          maxWords: Math.max(40, Math.round(currentWords * 0.75)),
        }
      : requestedSpec;
  const instruction =
    input.action === "custom"
      ? input.customInstruction?.trim() || "Improve clarity and specificity."
      : REWRITE_GUIDANCE[input.action];

  const completion = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a ruthless human editor for Mazhar Hayat's LinkedIn posts.

${HUMAN_VOICE_RULES}

Preserve every factual claim unless the instruction explicitly asks to remove it. Never add experience, metrics, quotations, or news. Return strict JSON:
{"hook":"first line","body":"full revised post","alternativeHooks":["hook 2","hook 3"]}`,
      },
      {
        role: "user",
        content: `Editing instruction: ${instruction}
Audience: ${(input.audience ?? "general").replaceAll("_", " ")}
Target: ${spec.minWords}-${spec.maxWords} words.

ORIGINAL:
${input.body}

Return the revised post only as JSON.`,
      },
    ],
    temperature: 0.62,
    max_tokens: input.length === "long" ? 3072 : 2048,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq.");
  const parsed = JSON.parse(stripJsonFences(raw)) as {
    hook?: string;
    body?: string;
    alternativeHooks?: string[];
  };
  const body = sanitizeBody(parsed.body ?? "");
  if (!body) throw new Error("Rewritten post was empty.");

  return {
    hook: parsed.hook?.trim() || body.split("\n")[0]?.slice(0, 120) || "",
    body,
    alternativeHooks: Array.isArray(parsed.alternativeHooks)
      ? parsed.alternativeHooks
          .map((hook) => String(hook).trim())
          .filter(Boolean)
          .slice(0, 2)
      : [],
    qualityIssues: auditPostBody(body, spec).issues,
  };
}

export async function generateCarouselSlides(
  postBody: string,
): Promise<CarouselSlide[]> {
  const groq = await getGroq();
  const completion = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `Turn an existing LinkedIn post into a document carousel.
Use only facts in the post. Produce 6-9 slides. Slide 1 is a strong cover; the last slide closes with one useful takeaway or question. Each title is at most 9 words. Each body is at most 35 words. No hashtags, emojis, invented facts, or generic filler.
Return strict JSON: {"slides":[{"title":"...","body":"..."}]}`,
      },
      {
        role: "user",
        content: `SOURCE POST:\n${postBody}\n\nCreate the carousel JSON.`,
      },
    ],
    temperature: 0.55,
    max_tokens: 1800,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq.");
  const parsed = JSON.parse(stripJsonFences(raw)) as {
    slides?: Array<Partial<CarouselSlide>>;
  };
  const slides = (parsed.slides ?? [])
    .filter((slide) => slide.title?.trim() && slide.body?.trim())
    .slice(0, 9)
    .map((slide) => ({
      title: slide.title!.trim().slice(0, 100),
      body: slide.body!.trim().slice(0, 320),
    }));
  if (slides.length < 3) throw new Error("Not enough carousel slides generated.");
  return slides;
}

export async function generateContentSeries(input: {
  theme: string;
  count: number;
  audience: PostAudience;
  styleExamples?: string[];
}): Promise<Array<{ topic: string; hook: string; body: string }>> {
  const groq = await getGroq();
  const count = Math.min(6, Math.max(1, Math.round(input.count)));
  const completion = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You create cohesive LinkedIn series for Mazhar Hayat.

${HUMAN_VOICE_RULES}

Each installment must stand alone, cover a different angle, and move the series forward. Never invent personal experience or metrics. Write 100-170 words per installment. Return strict JSON:
{"posts":[{"topic":"internal topic","hook":"first line","body":"complete post"}]}`,
      },
      {
        role: "user",
        content: `Series theme: ${input.theme}
Audience: ${input.audience.replaceAll("_", " ")}
Installments: ${count}
${input.styleExamples?.length ? `\nApproved voice examples (copy cadence, never facts):\n${input.styleExamples.map((item) => item.slice(0, 600)).join("\n---\n")}` : ""}

Create exactly ${count} distinct installments. Do not label them "Part 1" unless it reads naturally.`,
      },
    ],
    temperature: 0.72,
    max_tokens: 5000,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq.");
  const parsed = JSON.parse(stripJsonFences(raw)) as {
    posts?: Array<{ topic?: string; hook?: string; body?: string }>;
  };
  const posts = (parsed.posts ?? [])
    .filter((post) => post.topic?.trim() && post.body?.trim())
    .slice(0, count)
    .map((post) => {
      const body = sanitizeBody(post.body ?? "");
      return {
        topic: post.topic!.trim().slice(0, 500),
        hook:
          post.hook?.trim() || body.split("\n")[0]?.slice(0, 120) || "",
        body,
      };
    });
  if (posts.length !== count) {
    throw new Error(`Expected ${count} series posts but received ${posts.length}.`);
  }
  return posts;
}

export async function generatePublishKit(input: {
  body: string;
  topic: string;
  audience?: PostAudience;
  template?: PostTemplate;
}): Promise<{ firstComment: string; hashtags: string[] }> {
  const fallbackHashtags = suggestHashtags({
    topic: input.topic,
    audience: input.audience,
    template: input.template,
  });
  const fallbackComment =
    "If you have shipped something similar, what would you change first?";
  try {
    const groq = await getGroq();
    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `Write a LinkedIn first comment and 3-5 hashtags for the post.
The first comment is a short follow-up the author posts immediately after publishing. It should invite a useful reply, add one extra detail, or ask one specific question. No hashtags, emojis, or invented facts. 20-45 words.
Hashtags are PascalCase words without the # prefix.
Return JSON: {"firstComment":"...","hashtags":["TagOne","TagTwo"]}`,
        },
        {
          role: "user",
          content: `Topic: ${input.topic}
Audience: ${(input.audience ?? "general").replaceAll("_", " ")}

POST:
${input.body}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty publish kit.");
    const parsed = JSON.parse(stripJsonFences(raw)) as {
      firstComment?: string;
      hashtags?: string[];
    };
    const firstComment = (parsed.firstComment ?? "")
      .replace(/#\w+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);
    return {
      firstComment: firstComment || fallbackComment,
      hashtags: suggestHashtags({
        topic: input.topic,
        audience: input.audience,
        template: input.template,
        extra: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      }),
    };
  } catch {
    return { firstComment: fallbackComment, hashtags: fallbackHashtags };
  }
}
