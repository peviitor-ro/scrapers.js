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
  const url = "https://wd3.myworkdaysite.com/wday/cxs/mdlz/External/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  const data = {
    appliedFacets: { locationCountry: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  let soup = await scraper.post(data);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total / limit + (total % limit === 0 ? 0 : 1)
  );

  const jobs = [];
  for (let i = 0; i < numberOfPages; i++) {
    const items = soup.jobPostings;
    for (const item of items) {
      const job_title = item.title;
      const job_link_prefix =
        "https://wd3.myworkdaysite.com/en-US/recruiting/mdlz/External";
      const job_link = job_link_prefix + item.externalPath;
      const city = item.locationsText.split(",")[0];

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city)
      );

      let counties = [];
      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }

    data.offset = i + 1 * limit;
    soup = await scraper.post(data);
  }
  return jobs;
};

const run = async () => {
  const company = "Mondelez";
  const logo =
    "https://wd3.myworkdaysite.com/recruiting/mdlz/External/assets/logo";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
