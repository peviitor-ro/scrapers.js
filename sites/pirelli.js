const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://jobs.pirelli.com/services/recruiting/v1/jobs";
  const data = {
    locale: "en_GB",
    pageNumber: 0,
    sortBy: "",
    keywords: "",
    location: "",
    facetFilters: { filter1: ["Romania"] },
    brand: "",
    skills: [],
    categoryId: 0,
    alertId: "",
    rcmCandidateId: "",
  };
  const scraper = new Scraper(url);
  const res = await scraper.post(data);

  const items = res.jobSearchResult;

  const jobs = [];

  for (const job of items) {
    const job_title = job.response.urlTitle;
    const job_link = `https://jobs.pirelli.com/job/${job.response.urlTitle}/${job.response.id}-${job.response.supportedLocales[0]}`;
    const city = job.response.cust_location;

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city)
    );
    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Pirelli";
  const logo =
    "https://d2snyq93qb0udd.cloudfront.net/corporate/logo-pirelli2x.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
