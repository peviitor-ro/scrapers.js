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
    "https://finastra.wd3.myworkdayjobs.com/wday/cxs/finastra/FINC/jobs";

  const jobs = [];

  const data = {
    appliedFacets: { locations: ["8061b46e8417013734b3e7821f405d4e"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };

  const scraper = new Scraper(url);
  let res = await scraper.post(data)
  const jobsNumber = res.total;
  const pages = Math.ceil(jobsNumber / 20);
  console.log(`Total jobs: ${jobsNumber}, Pages: ${pages}`);

  for (let i = 1; i <= pages; i++) {
    for (const job of res.jobPostings) {
      const job_title = job.title;
      const job_link = `https://finastra.wd3.myworkdayjobs.com/en-US/FINC${job.externalPath}`;
      const city = translate_city(job.locationsText);
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        city,
        counties
      );

      jobs.push(job_element);
    }
    if (i < pages) {
      data.offset = i * 20;
      res = await scraper.post(data);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Finastra";
  const logo =
    "https://logowik.com/content/uploads/images/finastra2515.logowik.com.webp";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };

