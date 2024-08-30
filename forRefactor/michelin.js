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
    "https://michelinhr.wd3.myworkdayjobs.com/wday/cxs/michelinhr/Michelin/jobs";
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

  const jobs = [];

  let res = await scraper.post(data);

  const { total } = res;
  let items = res.jobPostings;

  const numberOfPages = Math.ceil(total / limit);

  for (let i = 1; i < numberOfPages; i++) {
    for (const item of items) {
      const job_title = item.title;
      const job_link_prefix =
        "https://michelinhr.wd3.myworkdayjobs.com/en-US/Michelin";
      const job_link = job_link_prefix + item.externalPath;
      const remote = item.remoteType ? [item.remoteType.toLowerCase()] : [];
      const locations = item.locationsText.split(",");

      const cities = [];
      const counties = [];

      for (const location of locations) {
        const city = translate_city(location.trim());
        const { city: c, county: co } = await _counties.getCounties(city);

        if (c) {
          cities.push(c);
          counties.push(...co);
        }
      }

      const job = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties,
        remote
      );
      jobs.push(job);
    }
    data.offset = i * limit;
    console.log(data.offset);
    res = await scraper.post(data);
    jobPostings = res.jobPostings;
  }
  return jobs;
};

const run = async () => {
  const company = "Michelin";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/08/Michelin-logo-640x360.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
