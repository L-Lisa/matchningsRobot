const BASE_URL = "https://jobsearch.api.jobtechdev.se";

export async function searchJobs(queries, regionCode = "") {
  const allJobs = [];
  const seenIds = new Set();

  for (const query of queries) {
    try {
      let url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=35`;
      if (regionCode) url += `&region=${encodeURIComponent(regionCode)}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`AF API error for query "${query}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      const hits = data.hits || [];

      for (const job of hits) {
        if (!seenIds.has(job.id)) {
          seenIds.add(job.id);
          allJobs.push(job);
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch jobs for query "${query}":`, err);
    }
  }

  return allJobs;
}
