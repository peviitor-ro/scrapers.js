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
  const url =
    "https://borgwarner.wd5.myworkdayjobs.com/wday/cxs/borgwarner/BorgWarner_Careers/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  const payload = {
    appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit,
    offset: 0,
    searchText: "",
  };
  let soup = await scraper.post(payload);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total % limit === 0 ? total / limit : total / limit + 1
  );
  const jobs = [];
  for (let i = 0; i < numberOfPages; i += 1) {
    payload.offset = i * limit;
    soup = await scraper.post(payload);
    const { jobPostings } = soup;

    for (const job of jobPostings) {
      const job_title = job.title;
      const job_link_prefix =
        "https://borgwarner.wd5.myworkdayjobs.com/en-US/BorgWarner_Careers";
      const job_link = job_link_prefix + job.externalPath;

      const separatorIndex = job.locationsText.indexOf(" - ");
      const city = translate_city(
        job.locationsText.substring(0, separatorIndex)
      );

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job_element);
    }
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
