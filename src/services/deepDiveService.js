const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

function extractJSON(text) {
  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(clean);
  } catch {}
  const objMatch = clean.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }
  throw new Error("Kunde inte tolka svaret. Försök igen.");
}

export async function getDeepDive(cvText, profile, job) {
  const description = (job.description?.text || "").slice(0, 2500);
  const employer = job.employer?.name || "";
  const headline = job.headline || "";

  const system = `You are an expert Swedish job coach and recruiter with deep knowledge of the Swedish labor market, Swedish interview culture (kompetensbaserade intervjuer, STAR-metoden, situationsfrågor), and how Swedish employers conduct hiring processes. You help job seekers prepare for specific job interviews. Return ONLY valid JSON, no markdown, no explanation.`;

  const user = `Candidate profile:
Skills: ${(profile.skills || []).join(", ")}
Suitable roles: ${(profile.roles || []).join(", ")}

CV (excerpt):
${cvText.slice(0, 1500)}

Job ad:
Title: ${headline}
Employer: ${employer}
Description:
${description}

Return a JSON object with exactly these fields:
{
  "questions": [
    { "type": "Motivationsfråga", "question": "..." },
    { "type": "Kompetensfråga", "question": "..." },
    { "type": "Situationsfråga", "question": "..." },
    { "type": "Beteendefråga", "question": "..." },
    { "type": "Framtidsfråga", "question": "..." }
  ],
  "missingKeywords": ["keyword1", "keyword2", ...]
}

Strict rules:
- Write ALL questions in the SAME LANGUAGE as the job ad description (Swedish if Swedish, English if English)
- Every question must be grounded in the actual job description — never invent requirements not mentioned in the ad
- Motivationsfråga: ask why this specific role at this specific employer appeals to the candidate — use the employer name and concrete details from the job description
- Kompetensfråga: ask about a specific technical skill, tool, method, or responsibility explicitly named in the job description
- Situationsfråga: must begin "Berätta om en situation då du..." (Swedish) or "Tell me about a time when you..." (English) — reference a key challenge or responsibility from the job description
- Beteendefråga: ask how the candidate typically works in a scenario directly relevant to the role (e.g. how they handle pressure, collaborate across teams, manage competing priorities) — must be specific to what the job requires
- Framtidsfråga: ask about career direction in a way that connects to the growth or development opportunities in this specific role
- missingKeywords: return 5–10 specific skills, tools, certifications, frameworks, or domain terms from the job description that do NOT appear in the CV — be precise, skip generic words like "kommunikation", "teamwork", or "flexibel"`;

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
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 429) {
      throw new Error("ROBOT_JUICE_EMPTY");
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error (${response.status})`);
  }

  const data = await response.json();
  return extractJSON(data.content[0].text);
}
