const BASE_URL = "https://jobsearch.api.jobtechdev.se";

export async function searchJobs(queries) {
  const allJobs = [];
  const seenIds = new Set();

  for (const query of queries) {
    try {
      const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=35`;
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

  // Filter to Stockholm area
  return allJobs.filter((job) => {
    const municipality = (job.workplace_address?.municipality || "").toLowerCase();
    const region = (job.workplace_address?.region || "").toLowerCase();
    return municipality.includes("stockholm") || region.includes("stockholm");
  });
}
