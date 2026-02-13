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
  url = "https://eaton.eightfold.ai/api/pcsx/search?domain=eaton.com&query=&location=Romania&start=0&filter_distance=80&filter_include_remote=1";
  let scraper = new Scraper(url);
  let type = "JSON";
  let response = await scraper.get_soup(type);
  const pages = Math.ceil(response.data.count / 10);

  const fetchPages = async () => {
    const jobs = [];
    for (let page = 0; page < pages; page += 10) {
      
      const jobspage = response.data.positions.map((job) => {
        return {
          name: job.name,
          canonicalPositionUrl: job.positionUrl,
          locations: job.locations,
        };
      });
      jobs.push(...jobspage);
      scraper = new Scraper(
        `https://eaton.eightfold.ai/api/pcsx/search?domain=eaton.com&query=&location=Romania&start=${page}&filter_distance=80&filter_include_remote=1`,
      );
      response = await scraper.get_soup(type);
    }
    return jobs;
  };

  const elements = await fetchPages();

  for (const job of elements) {
    const job_title = job.name;
    const job_link = `https://eaton.eightfold.ai${job.canonicalPositionUrl}`;
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