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
  const url = "https://www.fildas.ro/cariere/";

  const scraper = new Scraper(url);
  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup.findAll("h2");

  for (const elem of jobsElements) {
    const job_title = elem.text.trim().split("&#8211;")[0];
    const job_link = url + "#:~:text=" + job_title;
    const locations = elem.text.trim().split("&#8211;")[1].split(",");
    let cities = [];
    let counties = [];

    for (const location of locations) {
      const { city: c, county: co } = await _counties.getCounties(
        translate_city(location.trim())
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
  const company = "fildas";
  const logo =
    "https://www.fildas.ro/wp-content/uploads/2023/02/logo-Fildas-894x205.jpg?x32301";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job