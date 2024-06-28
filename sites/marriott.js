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
    "https://jobs.marriott.com/api/jobs?location=Romania&page=1&limit=100";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("JSON");
  const items = soup.jobs;
  const jobs = [];

  for (const item of items) {
    const job = item.data;
    const job_title = job.title;
    const job_link = job.meta_data.canonical_url;
    const country = job.country;
    const city = translate_city(job.city);

    const { city: c, county: co } = await _counties.getCounties(city);
    const job_type = job.job_type ? job.job_type : "";
    const remote = get_jobtype(job_type);

    const job_element = generateJob(
      job_title,
      job_link,
      country,
      c,
      co,
      remote
    );
    jobs.push(job_element);
  }
  return jobs;
};

const run = async () => {
  const company = "Marriott";
  const logo = "https://content.ejobs.ro/img/logos/3/3431.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
