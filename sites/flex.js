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
  let url =
    " https://flextronics.wd1.myworkdayjobs.com/wday/cxs/flextronics/Careers/jobs";

  const s = new Scraper(url);
  s.config.headers["Content-Type"] = "application/json";
  s.config.headers["Accept"] = "application/json";

  let data = {
    appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };

  const jobs = [];

  const res = await s.post(data);
  const jobsNumber = res.total;
  const pages = Math.ceil(jobsNumber / 20);

  for (let i = 0; i < pages; i++) {
    data["offset"] = i * 20;
    const response = await s.post(data);
    const items = response.jobPostings;

    for (const job of items) {
      const job_title = job.title;
      const job_link =
        "https://flextronics.wd1.myworkdayjobs.com/ro-RO/Careers" +
        job.externalPath;
      const city = translate_city(job.locationsText.split(",")[1]);
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city.trim())
      );

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        c,
        counties
      );

      jobs.push(job_element);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Flex";
  const logo = "https://flex.com/wp-content/themes/flex/images/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };