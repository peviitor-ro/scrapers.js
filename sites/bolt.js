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
  let url =
    "https://node.bolt.eu/careers-portal/careersPortal/v3/getJobs/?version=CP.4.07";
  const jobs = [];
  const scraper = new Scraper(url);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const json = res.data.jobs;

  await Promise.all(
    json.map(async (item) => {
      const country = item.locations[0].country;
      if (country !== "Romania") return;

      let cities = [];
      let counties = [];
      const job_title = item.title;
      const job_link = "https://bolt.eu/en/careers/positions/" + item.id;
      
      const city = translate_city(item.locations[0].city);
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
      const job = generateJob(job_title, job_link, country, cities, counties);
      jobs.push(job);
    })
  );
  return jobs;
};

const run = async () => {
  const company = "Bolt";
  const logo = "https://bolt.eu/bolt-logo-original-on-white.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
}

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job

