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
    "https://prod-search-api.jobsyn.org/api/v1/solr/search?location=Romania&page=1";

  const scraper = new Scraper(url);
  scraper.config.headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-origin": "https://qualcomm.dejobs.org",
    "User-Agent": "Mozilla/5.0",
  };
  const jobs = [];

  const res = await scraper.get_soup("JSON");

  const items = res.jobs;

  for (const item of items) {
    const job_title = item.title_exact;
    const job_link = "https://qualcomm.dejobs.org/" + item.guid;
    const location = translate_city(item.city_exact);
    const { city: c, county: co } = await _counties.getCounties(location);

    const job = generateJob(job_title, job_link, "Romania", c, co);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Qualcomm";
  const logo =
    "https://cdn.cookielaw.org/logos/b0a5f2cc-0b29-4907-89bf-3f6b380a03c8/0814c8dd-07ff-41eb-a1b0-ee0294137c9a/9ca69c31-5e86-432d-950c-cfa7fcaa3cc8/1280px-Qualcomm-Logo.svg.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
