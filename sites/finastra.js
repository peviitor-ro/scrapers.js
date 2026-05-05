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
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText: "",
  };

  const scraper = new Scraper(url);
  let res = await scraper.post(data)
  const jobsNumber = res.total;
  const pages = Math.ceil(jobsNumber / 20);
  console.log(`Total jobs: ${jobsNumber}, Pages: ${pages}`);

  const allPostings = [];

  for (let i = 1; i <= pages; i++) {
    for (const job of res.jobPostings) {
      allPostings.push(job);
    }
    if (i < pages) {
      data.offset = i * 20;
      res = await scraper.post(data);
    }
  }

  for (const job of allPostings) {
    const job_title = job.title;
    const job_link = `https://finastra.wd3.myworkdayjobs.com/en-US/FINC${job.externalPath}`;
    let city = job.locationsText;

    if (city && city.includes("Locations")) {
      const match = job.externalPath.match(/\/job\/([^\/]+)/);
      city = match ? translate_city(match[1]) : translate_city(city);
    } else {
      city = translate_city(city);
    }

    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(city);

    if (c) {
      counties = [...new Set([...counties, ...co])];
      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        city,
        counties
      );

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Finastra";
  const logo =
    "https://logowik.com/content/uploads/images/finastra2515.logowik.com.webp";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
