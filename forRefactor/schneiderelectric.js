const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
  range,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://careers.se.com/api/jobs?keywords=Romania&lang=en-US&page=1&sortBy=relevance&descending=false&internal=false";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("JSON");

  const jobs = [];

  const totalJobs = res.languageCounts["en-us"].count;
  const pages = range(1, totalJobs, 10);

  for (const page of pages) {
    const url = `https://careers.se.com/api/jobs?keywords=Romania&lang=en-US&page=${page}&sortBy=relevance&descending=false&internal=false`;
    const s = new Scraper(url);

    const res = await s.get_soup("JSON");

    const items = res.jobs;

    for (const item of items) {
      const jobElement = item.data;

      const locations = jobElement.full_location.split(";");
      const remote = jobElement.multipleLocations ? "remote" : [];

      const cities = [];
      let counties = [];

      for (const location of locations) {
        const city = location.split(",")[0];

        const { city: c, county: co } = await _counties.getCounties(
          translate_city(city.trim())
        );

        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
      }

      const job = generateJob(
        jobElement.title,
        jobElement.meta_data.job_description_url,
        "Romania",
        cities,
        counties,
        remote
      );
      jobs.push(job);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "SchneiderElectric";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Schneider_Electric_2007.svg/284px-Schneider_Electric_2007.svg.png?20150906005100";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
