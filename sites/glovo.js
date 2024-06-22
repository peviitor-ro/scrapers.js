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
  let url = "https://boards-api.greenhouse.io/v1/boards/glovo/jobs";

  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  for (const job of res.jobs) {
    const country = job.location.name;
    if (country.includes("Romania")) {
      const job_title = job.title;
      const job_link = job.absolute_url;
      const locations = job.location.name.split(",");
      const cities = [];
      let counties = [];

      for (const location of locations) {
        const city = translate_city(location);

        const { city: c, county: co } = await _counties.getCounties(city);

        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties
      );

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Glovo";
  const logo =
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/317px-Glovo_logo.svg.png?20220725155704";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
