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
  const jobs = [];
  let scraper = new Scraper(
    "https://eaton.eightfold.ai/api/apply/v2/jobs/687221715862/jobs?domain=eaton.com"
  );
  let type = "JSON";
  let response = await scraper.get_soup(type);
  const pages = Math.ceil(response.count / 10);

  const fetchPages = async () => {
    const jobs = [];
    for (let page = 0; page < pages; page += 10) {
      scraper = new Scraper(
        `https://eaton.eightfold.ai/api/apply/v2/jobs?start=${page}&num=${
          page + 10
        }&location=romania`
      );
      response = await scraper.get_soup(type);
      const jobspage = response.positions;
      jobs.push(...jobspage);
    }
    return jobs;
  };

  const elements = await fetchPages();

  for (const job of elements) {
    const job_title = job.name;
    const job_link = job.canonicalPositionUrl;
    let city;
    let county;
    const locations = job.locations;
    for (const location of locations) {
      if (location.includes("Romania") || location.includes("ROU")) {
        try {
          city = location.split(",")[0];
          const obj = await _counties.getCounties(
            translate_city(city.trim())
          );
          city = obj.city;
          county = obj.county;
        } catch (error) {
          city = location;
          const obj = await _counties.getCounties(
            translate_city(city.trim())
          );
          city = obj.city;
          county = obj.county;
        }
      }
    }

    jobs.push(generateJob(job_title, job_link, "Romania", city, county));
  }

  return jobs;
};

const run = async () => {
  const company = "Eaton";
  const logo = "https://assets.jibecdn.com/prod/eaton/0.2.148/assets/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job