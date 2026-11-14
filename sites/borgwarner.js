const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const SEARCH_URL = "https://www.borgwarner.com/careers/job-search";
const PAGE_SIZE = 20;

const getWorkdayLink = async (jobId) => {
  const scraper = new Scraper(`${SEARCH_URL}?country=romania&id=${jobId}`);
  const soup = await scraper.get_soup("HTML");
  const applyLink = soup.find("a", { id: "aApply" });

  if (applyLink?.attrs?.href) {
    return applyLink.attrs.href.replace(/\/apply$/, "");
  }

  return `${SEARCH_URL}?country=romania&id=${jobId}`;
};

const getJobs = async () => {
  const jobs = [];
  let page = 1;
  let numberOfPages = 1;

  for (let i = 0; i < numberOfPages; i += 1) {
    const scraper = new Scraper(`${SEARCH_URL}?country=romania&page=${page}`);
    const soup = await scraper.get_soup("HTML");

    if (i === 0) {
      const resultsStats = soup.find("span", { id: "resultsStats" });
      const total = Number.parseInt(
        resultsStats?.text.match(/(\d+)\s+results/)?.[1] || "0",
        10
      );
      numberOfPages = Math.ceil(total / PAGE_SIZE);
    }

    const jobPostings = soup.findAll("div", { class: "workday-job-result" });

    for (const jobPosting of jobPostings) {
      const job_title = jobPosting.find("a")?.text.trim();
      const jobLink = (jobPosting.find("a")?.attrs?.href || "").replace(
        /&amp;/g,
        "&"
      );
      const jobId = jobLink.match(/[?&]id=([^&]+)/)?.[1];
      const locationNode = jobPosting.find("span", { class: "location" });

      if (!job_title || !jobId || !locationNode) {
        continue;
      }

      const job_link = await getWorkdayLink(jobId);

      const separatorIndex = locationNode.text.indexOf(" - ");
      const city = translate_city(
        locationNode.text.substring(0, separatorIndex).trim()
      );

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job_element);
    }

    page += 1;
  }
  return jobs;
};

const run = async () => {
  const company = "BorgWarner";
  const logo =
    "https://www.tyrepress.com/wp-content/uploads/2023/06/borgwarner-logo-550x191.png";
  const elements = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(elements, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
