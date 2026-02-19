const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";

function extractJSON(text) {
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  throw new Error("Kunde inte tolka svar från Claude.");
}

export async function getTopATSTip(cvText) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system:
        "Du är expert på ATS-system (Applicant Tracking Systems) och CV-optimering för den svenska arbetsmarknaden. Du svarar ALLTID med ett JSON-objekt. Aldrig med förklaringar utanför JSON.",
      messages: [
        {
          role: "user",
          content: `Analysera detta CV och identifiera DET ENDA viktigaste problemet ur ett ATS-perspektiv.
Välj det problem som mest sannolikt gör att CV:t filtreras bort automatiskt.

Returnera exakt detta JSON-format:
{
  "tip": "<Kort rubrik på problemet, max 8 ord>",
  "description": "<Tydlig förklaring av vad problemet är och varför ATS-system reagerar negativt på det. Max 2 meningar.>",
  "example": "<Konkret exempel på hur det kan förbättras baserat på texten i CV:t. Max 1 mening.>"
}

CV:
${cvText.substring(0, 3000)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API-fel (${res.status})`);
  }

  const data = await res.json();
  if (!data.content) throw new Error("Tomt svar från Claude.");
  return extractJSON(data.content[0].text);
}
