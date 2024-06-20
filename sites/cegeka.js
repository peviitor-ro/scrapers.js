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
  let url = "https://www.cegeka.com/en/ro/jobs/all-jobs?";

  const pattern = /let vacancies = \[{(.*)}\]/gm;

  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const jobsObject = res.text.match(pattern);

  const json = JSON.parse(jobsObject[0].replace("let vacancies = ", ""));

  for (const elem of json) {
    const job_title = elem.header_data.vacancy_title;
    const job_link = elem.slug;

    let cities = [];
    let counties = [];

    const locations = JSON.parse(elem.header_data.filter_location);

    for (const location of locations) {
      const { city: c, county: co } = await _counties.getCounties(
        translate_city(location.city.trim())
      );
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    const job = generateJob(job_title, job_link, "Romania", cities, counties);
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "Cegeka";
  const logo =
    "https://www.cegeka.com/hubfs/Cegeka%20Website%20-%202017/Logo/cegeka-logo-color.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
