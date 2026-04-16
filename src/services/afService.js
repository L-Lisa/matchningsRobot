const BASE_URL = "https://jobsearch.api.jobtechdev.se";
const REMOTE_CODE = "remote";

export async function searchJobs(queries, selectedRegions = []) {
  const allJobs = [];
  const seenIds = new Set();

  const regionCodes = selectedRegions.filter((c) => c !== REMOTE_CODE);
  const wantRemote = selectedRegions.includes(REMOTE_CODE);

  for (const query of queries) {
    try {
      const searchTerm = wantRemote ? `${query} distans remote hybrid` : query;
      let url = `${BASE_URL}/search?q=${encodeURIComponent(searchTerm)}&limit=35`;
      for (const code of regionCodes) {
        url += `&region=${encodeURIComponent(code)}`;
      }
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
