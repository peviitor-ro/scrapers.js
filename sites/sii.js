const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL = "https://www.siiromania.ro/jobopportunities/#section";

const normalizeLocation = (locationText) => {
  const value = locationText.trim();

  if (value.toLowerCase().includes("hybrid")) {
    return { cities: [], counties: [], remote: ["hybrid"] };
  }

  if (value.toLowerCase().includes("remote")) {
    return { cities: [], counties: [], remote: ["remote"] };
  }

  return { cities: [], counties: [], remote: [] };
};

const normalizeJobLink = (jobLink) =>
  jobLink.replace(/[?&]trk=[^&]+/g, "").replace(/\/+$/, "");

const extractJobsFromPage = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const rows = res.find("tbody")?.findAll("tr") || [];
  const jobs = [];

  for (const row of rows) {
    const cells = row.findAll("td");
    const linkNode = cells[0]?.find("a");

    if (!linkNode || cells.length < 4) {
      continue;
    }

    const job_title = linkNode.text.trim();
    const job_link = linkNode.attrs.href;
    const locationText = cells[2].text.trim();
    const { cities, counties, remote } = normalizeLocation(locationText);

    jobs.push(
      generateJob(job_title, job_link, "Romania", cities, counties, remote),
    );
  }

  return jobs;
};

const getJobs = async () => {
  const pageOneJobs = await extractJobsFromPage(URL);
  const pageTwoJobs = await extractJobsFromPage(
    "https://www.siiromania.ro/jobopportunities/page/2/#section",
  );

  const uniqueJobs = new Map();

  for (const job of [...pageOneJobs, ...pageTwoJobs]) {
    const normalizedLink = normalizeJobLink(job.job_link);
    uniqueJobs.set(normalizedLink, { ...job, job_link: normalizedLink });
  }

  return [...uniqueJobs.values()];
};

const run = async () => {
  const company = "SII";
  const logo =
    "https://www.siiromania.ro/wp-content/themes/corporate-sii-romania/img/logo.png";
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
