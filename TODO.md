# TODO

---

## CRITICAL — fix before production

- [ ] **[App.jsx:43] Index out-of-bounds on jobAds[r.idx]**
  Claude can return idx values that don't exist in the filtered jobAds array.
  Add bounds check: `const job = jobAds[r.idx]; if (!job) return null` and filter nulls.

- [ ] **[claudeService.js:27] No validation of data.content before access**
  `data.content[0].text` will throw if the API returns an unexpected shape.
  Guard with: `if (!Array.isArray(data.content) || !data.content[0]) throw new Error(...)`.

- [ ] **[atsService.js:59] Same data.content validation missing**
  `data.content[0].text` accessed without checking the array has length.
  Same fix as above.

- [ ] **[App.jsx:43] rankings not validated before .map()**
  If Claude returns valid JSON that isn't an array, `.slice(0, 5).map()` will throw.
  Add: `if (!Array.isArray(rankings)) throw new Error(...)`.

- [ ] **[App.jsx:43] r.reasons not validated before passing to JobCard**
  If Claude omits `reasons` or returns a string, the bullet list renders nothing.
  Add fallback: `reasons: Array.isArray(r.reasons) ? r.reasons : []`.

---

## HIGH — code quality & robustness

- [ ] **[claudeService.js + atsService.js] Duplicate extractJSON()**
  The function is implemented twice with slightly different logic and different
  error messages. Extract to `src/services/utils.js` and import in both.

- [ ] **[afService.js:10] All-query failure returns empty array silently**
  If every AF API query fails (API down, network error), `searchJobs()` returns `[]`
  instead of throwing. App.jsx then shows "inga jobb hittades" instead of "API nere".
  Throw if all queries failed: `if (allJobs.length === 0 && hadErrors) throw new Error(...)`.

- [ ] **[claudeService.js:39] Empty catch blocks hide parse errors**
  Silent `catch {}` blocks make debugging impossible. Add `console.warn` at minimum.

- [ ] **[claudeService.js:86] extractKeywords return not validated**
  After JSON parse, `profile.queries`, `profile.skills`, and `profile.roles` are used
  directly without checking they exist. If Claude returns valid JSON with missing fields,
  the search silently breaks.

- [ ] **[CVInput.jsx:30] PDF error is always "password protected"**
  Alert message doesn't match actual failure (could be corrupt file, scanned image,
  memory error, or CSP blocking the worker). Log real error and show a more accurate message.

- [ ] **[claudeService.js:44] Greedy regex can match across multiple JSON structures**
  `/\[[\s\S]*\]/` matches first `[` to last `]` in the whole string. If Claude
  returns multiple arrays in its response, it extracts invalid JSON spanning all of them.
  Use a non-greedy match or find balanced brackets.

---

## MEDIUM — architecture & maintenance

- [ ] **[Multiple] Model name hardcoded in two places**
  `"claude-sonnet-4-6"` is set separately in `claudeService.js` and `atsService.js`.
  Move to a shared `src/services/config.js` constant.

- [ ] **[Multiple] No fetch timeout on any API call**
  All `fetch()` calls can hang indefinitely. Wrap with `AbortController` + `setTimeout`
  (e.g. 30s) so the user gets an error instead of being stuck forever.

- [ ] **[ATSTip.jsx:12] Stale result race condition**
  If `cvText` changes while the ATS API call is in flight, the old tip is shown for
  the new CV. Use an `AbortController` or compare `cvText` at response time.

- [ ] **[App.jsx:21] Stale jobs visible during second search**
  If the user searches again and the second search errors mid-flight, old job results
  are still in state. Clear `jobs` when `handleSubmit` starts.

- [ ] **[claudeService.js:23] Non-JSON error body lost on API failure**
  If Anthropic returns a 500 with HTML, the `.catch(() => ({}))` swallows the body
  and the error message becomes just "Claude API error (500)". Log the raw text.

---

## LOW — polish & consistency

- [ ] **[atsService.js:15] Inconsistent Swedish error message**
  "Kunde inte tolka svar från Claude" — missing "svaret" and "Försök igen."
  Match the wording in `claudeService.js`.

- [ ] **[afService.js:20] Job object structure not validated**
  Jobs pushed to results without checking for required fields. Could render broken cards.
  Filter out jobs missing `id` or `headline` at minimum.

---

## FUTURE (v2)

- [ ] **Move API calls to a backend proxy**
  API key is currently exposed in browser code — acceptable for demo only.
  Production needs a server-side proxy (Node/Edge function).

- [ ] **Option B — Domain relevance sanity check**
  After `rankJobs` returns, do a second Claude call that reviews each reason and
  removes any that are cross-domain keyword stretches (e.g. factory skills cited
  for a coaching role). Adds one extra API call per search but improves result
  accuracy.
