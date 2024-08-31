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
  const url = "https://ortec.com/api/career";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  let soup = await scraper.post({});
  const jobs = [];

  const items = soup.filter((obj) => obj.country === "Romania");
  for (const item of items) {
    const job_title = item.title;
    const job_link = `https://ortec.com/en/careers/find-jobs/career/jobs?id=${item.jobId}`;
    const city = "Bucuresti";

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
  console.log(jobs);
  return jobs;
};

const run = async () => {
  const company = "Ortec";
  const logo = "https://media.academictransfer.com/LT8OEP2nAexUPaM9-WfgcP488FM=/fit-in/490x162/filters:upscale():fill(white)/logos/ortec-en-wide.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
