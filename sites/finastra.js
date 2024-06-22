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
  let url =
    "https://careers.finastra.com/api/jobs?location=Romania&woe=12&stretchUnit=MILES&stretch=100&sortBy=relevance&descending=false&internal=false";

  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");
  const jobsNumber = res.totalCount;
  const pages = Math.ceil(jobsNumber / 10);

  for (let i = 1; i <= pages; i++) {
    let url = `https://careers.finastra.com/api/jobs?location=Romania&woe=12&stretchUnit=MILES&stretch=100&page=${i}&sortBy=relevance&descending=false&internal=false`;

    const scraper = new Scraper(url);
    const response = await scraper.get_soup("JSON");
    const items = response.jobs;

    for (const job of items) {
      const job_title = job.data.title;
      const job_link = `https://careers.finastra.com/jobs/${job.data.slug}?lang=en-us`;
      const city = translate_city(job.data.city);
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        city,
        counties
      );

      jobs.push(job_element);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Finastra";
  const logo =
    "https://logowik.com/content/uploads/images/finastra2515.logowik.com.webp";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };

