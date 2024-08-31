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
  const url = "https://nxp.wd3.myworkdayjobs.com/wday/cxs/nxp/careers/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  const data = {
    appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  let soup = await scraper.post(data);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total % limit === 0 ? total / limit : total / limit + 1
  );

  const jobs = [];
  for (let i = 1; i < numberOfPages + 1; i += 1) {
    const items = soup.jobPostings;
    for (const item of items) {
      const job_title = item.title;
      const job_link_prefix = "https://nxp.wd3.myworkdayjobs.com/en-US/careers";
      const job_link = job_link_prefix + item.externalPath;
      const separatorIndex = item.locationsText.indexOf(",");
      let city = translate_city(
        item.locationsText.substring(separatorIndex + 1)
      );

      const { city: c, county: co } = await _counties.getCounties(city);

      let counties = [];
      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }
    data.offset = i * limit;
    soup = await scraper.post(data);
  }

  return jobs;
};

const run = async () => {
  const company = "NXP";
  const logo = "https://nxp.wd3.myworkdayjobs.com/careers/assets/logo";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
