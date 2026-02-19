# TODO

## Match quality

- [ ] **Option B — Domain relevance sanity check**
  After `rankJobs` returns, do a second Claude call that reviews each reason and
  removes any that are cross-domain keyword stretches (e.g. factory skills cited
  for a coaching role). Adds one extra API call per search but improves result
  accuracy. Consider only triggering it if any reason contains words like
  "optimering", "drift", "produktion" when the matched role is in a different
  industry.
