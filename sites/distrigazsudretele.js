const axios = require("axios");
const { translate_city, get_jobtype } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL =
  "https://jobs.engie.com/distrigaz/search/?q=&locationsearch=Romania&searchResultView=LIST";
const API_URL = "https://jobs.engie.com/services/recruiting/v1/jobs";

const getCsrfToken = async () => {
  const response = await axios.get(URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const token = response.data.match(/var CSRFToken = "([^"]+)";/)?.[1];

  if (!token) {
    throw new Error("Could not extract CSRF token.");
  }

  return token;
};

const getJobsPage = async (csrfToken, pageNumber) => {
  const payload = {
    locale: "en_US",
    pageNumber,
    sortBy: "",
    keywords: "",
    location: "Romania",
    facetFilters: {},
    brand: "distrigaz",
    skills: [],
    categoryId: 0,
    alertId: "",
    rcmCandidateId: "",
  };

  const response = await axios.post(API_URL, payload, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      Referer: URL,
      Origin: "https://jobs.engie.com",
    },
  });

  return response.data;
};

const buildJobLink = (job) =>
  `https://jobs.engie.com/distrigaz/job/${job.unifiedUrlTitle}/${job.id}-en_US/`;

const getJobs = async () => {
  const csrfToken = await getCsrfToken();
  const jobs = [];
  let pageNumber = 0;
  let totalJobs = 0;

  do {
    const response = await getJobsPage(csrfToken, pageNumber);
    const items = response.jobSearchResult || [];

    if (pageNumber === 0) {
      totalJobs = response.totalJobs || items.length;
    }

    for (const item of items) {
      const job = item.response;
      const job_title = job.unifiedStandardTitle;
      const job_link = buildJobLink(job);
      const remote = get_jobtype(job_title.toLowerCase());
      const cityLabel =
        job.jobLocationShort?.[0]?.split(",")?.[0]?.trim() || "";
      const city = translate_city(cityLabel);
      let cities = [];
      let counties = [];

      if (city) {
        const { city: c, county: co } = await _counties.getCounties(city);
        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
      }

      jobs.push(
        generateJob(job_title, job_link, "Romania", cities, counties, remote),
      );
    }

    pageNumber += 1;
  } while (jobs.length < totalJobs);

  return jobs;
};

const run = async () => {
  const company = "DistrigazSudRetele";
  const logo =
    "https://www.distrigazsud-retele.ro/wp-content/themes/distrigaz/images/logo-footer.png";
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
