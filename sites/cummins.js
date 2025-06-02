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
    "https://prod-search-api.jobsyn.org/api/v1/solr/search?location=Romania&page=1&num_items=100";
  
  const scraper = new Scraper(url);
  Object.assign(scraper.config.headers, {
    "Content-Type": "application/json",
    "x-origin": "https://cummins.jobs",
  });
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";
  const jobs = [];

  const soup = await scraper.get_soup("JSON");

  const jobsElements = soup.jobs;

  try{
    for (let index = 0; index < jobsElements.length; index++) {
      const job_title = jobsElements[index].title_exact;
      const job_link =
        "https://cummins.jobs/" +
        soup.filters.city[index].link.split("/")[2] +
        "/" +
        jobsElements[index].title_slug +
        "/" +
        jobsElements[index].guid +
        "/job/";

      const city = jobsElements[index].city_exact;

      let cities = [];
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city[1])
      );

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", cities, counties);
      jobs.push(job);
    }
  } catch {}

  return jobs;
};

const run = async () => {
  const company = "Cummins";
  const logo = "https://dn9tckvz2rpxv.cloudfront.net/cummins/img4/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
