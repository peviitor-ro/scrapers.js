const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL =
  "https://careers.unilever.com/search-jobs/results?ActiveFacetID=798549&RecordsPerPage=1000&Distance=50&RadiusUnitType=0&Location=Romania&ShowRadius=False&IsPagination=False&FacetType=0&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=15&FacetFilters%5B0%5D.Display=Romania&FacetFilters%5B0%5D.IsApplied=true&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=1&OrganizationIds=34155&ResultsType=0";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers = {
    ...scraper.config.headers,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
  };

  const res = await scraper.get_soup("JSON");

  if (!res.hasJobs) {
    return [];
  }

  const jobs = [];
  const resultsHtml = res.results || "";
  const matches = [
    ...resultsHtml.matchAll(
      /<li>\s*<a href="([^"]+)"[^>]*>\s*<h2 class="global-job-list__title">([\s\S]*?)<\/h2>\s*<span class="job-location[^"]*">([\s\S]*?)<\/span>/g,
    ),
  ];

  for (const match of matches) {
    const job_link = `https://careers.unilever.com${match[1]}`;
    const job_title = match[2].replace(/<[^>]+>/g, "").trim();
    const location = match[3].replace(/<[^>]+>/g, "").trim();

    if (!location.toLowerCase().includes("romania")) {
      continue;
    }

    jobs.push(generateJob(job_title, job_link, "Romania"));
  }

  return jobs;
};

const run = async () => {
  const company = "Unilever";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/06/Unilever-Logo-500x379.png";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
