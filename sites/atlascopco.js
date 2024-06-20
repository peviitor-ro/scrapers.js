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
    "https://www.atlascopco.com/content/cl-ma-sp/ro-ro/jobs/job-overview/jcr:content/par/jobs_overview_copy.jobs.json?keyword=Romania";
  const scraper = new Scraper(url);
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const json = res.jobs;
  const jobs = [];

  for (const item of json) {
    let cities = [];
    let counties = [];
    const job_title = item.Title;
    const job_link = "https://www.atlascopco.com" + item.path;
    const country = "Romania";
    const city = translate_city(item.Cities);
    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }
    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "AtlasCopco";
  const logo =
    "https://www.atlascopco.com/etc.clientlibs/settings/wcm/designs/accommons/design-system/clientlib-assets/resources/icons/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
