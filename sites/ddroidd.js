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
    "https://api.storyblok.com/v2/cdn/stories/?version=published&starts_with=vacancies%2F&&&excluding_ids=-1&token=4pOFw3LnvRlerPVVh0AB1Qtt&cv=undefined";

  const jobs = [];
  const scraper = new Scraper(url);
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const json = res.stories;

  for (const item of json) {
    const job_title = item.name;
    const job_link = "https://www.ddroidd.com/" + item.full_slug;
    const remote = item.content.type.toLowerCase().includes("remote")
      ? ["Remote"]
      : [];

    let cities = [];
    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(item.content.location)
    );

    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(
      job_title,
      job_link,
      "Romania",
      cities,
      counties,
      remote
    );
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "DDroidd";
  const logo = "https://www.ddroidd.com/img/header-logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
