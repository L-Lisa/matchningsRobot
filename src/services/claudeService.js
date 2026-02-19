const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(system, userMessage, maxTokens) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error (${response.status})`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function extractJSON(text) {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(clean);
  } catch {}

  // Find outermost JSON array
  const arrStart = clean.indexOf("[");
  if (arrStart !== -1) {
    try {
      return JSON.parse(clean.slice(arrStart));
    } catch {}
    const arrMatch = clean.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch {}
    }
  }

  // Find outermost JSON object
  const objStart = clean.indexOf("{");
  if (objStart !== -1) {
    try {
      return JSON.parse(clean.slice(objStart));
    } catch {}
    const objMatch = clean.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
  }

  throw new Error("Kunde inte tolka svaret från Claude. Försök igen.");
}

export async function extractKeywords(cvText) {
  const system =
    "You are an expert in CV analysis and the Swedish job market. Return ONLY a valid JSON object, no explanation, no markdown.";

  const user = `Analyze this CV and return a JSON object with exactly these fields:
- "queries": array of 4 short Swedish job search terms suitable for Arbetsförmedlingen (e.g. "mjukvaruutvecklare", "projektledare IT")
- "skills": array of 8 key technical or professional skills extracted from the CV
- "roles": array of 3 suitable Swedish job titles for this person

CV:
${cvText}`;

  const text = await callClaude(system, user, 700);
  return extractJSON(text);
}

export async function rankJobs(cvProfile, jobs) {
  const jobsToSend = jobs.slice(0, 80).map((job, idx) => ({
    idx,
    title: job.headline,
    employer: job.employer?.name || "",
    location:
      job.workplace_address?.municipality ||
      job.workplace_address?.region ||
      "",
    description: (job.description?.text || "").slice(0, 350),
  }));

  const system =
    "You are an expert in job matching for the Swedish job market. Return ONLY a valid JSON array, no explanation, no markdown. Only cite a reason if the candidate's experience is relevant in the same or a closely related domain. Do not extrapolate skills across unrelated industries based on surface-level keyword overlap — for example, factory process optimization is not relevant for a social services or coaching role unless the job explicitly requires it.";

  const user = `Candidate profile:
Skills: ${cvProfile.skills.join(", ")}
Suitable roles: ${cvProfile.roles.join(", ")}

Job listings:
${JSON.stringify(jobsToSend, null, 2)}

Return a JSON array of the top 5 best matches. Each item must have:
- "idx": number (the job's idx from the list above)
- "score": number between 1 and 100
- "reasons": array of exactly 3 short Swedish strings (max 12 words each) — each is one specific reason why this job matches the candidate

Sort by score descending.`;

  const text = await callClaude(system, user, 1000);
  return extractJSON(text);
}
