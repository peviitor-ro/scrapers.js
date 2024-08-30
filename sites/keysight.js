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
    "https://jobs.keysight.com/api/jobs?stretchUnits=MILES&stretch=10&location=Romania&lat=46&lng=25&woe=12&limit=100&page=1&sortBy=relevance&descending=false&internal=false";

  const scraper = new Scraper(url);

  let res = await scraper.get_soup("JSON");

  const jobs = [];

  const items = res.jobs;

  for (const item of items) {
    const job = item.data;
    const job_title = job.title;
    const job_link = "https://jobs.keysight.com/external/jobs/" + job.slug;
    const city = job.city;
    const remote = job.location_type === "ANY" ? ["remote"] : [];

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city)
    );

    let counties = [];
    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job_element = generateJob(
      job_title,
      job_link,
      "Romania",
      c,
      counties,
      remote
    );
    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Keysight";
  const logo =
    "https://rmkcdn.successfactors.com/b5c39f83/8331f5be-826f-4ccf-ae53-f.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
