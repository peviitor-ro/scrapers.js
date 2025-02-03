const { translate_city, get_jobtype } = require("../utils.js");
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
    "https://career.globant.com/api/sap/job-requisition?&page=1&country=RO";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("JSON");
  const items = res.jobRequisition;

  const jobs = [];

  let job_id = 0;

  for (const item of items) {
    const job_title = item.jobTitle;
    const job_link = "https://career.globant.com/?country=RO" + "#" + job_id;
    const country = "Romania";

    const remote = get_jobtype(item.location.toLowerCase());

    const job = generateJob(
      job_title,
      job_link,
      country,
      "",
      "",
      remote
    );
    jobs.push(job);
    job_id++;
  }
  return jobs;
};

const run = async () => {
  const company = "Globant";
  const logo =
    "https://seekvectorlogo.com/wp-content/uploads/2019/06/globant-vector-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
