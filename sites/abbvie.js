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
    "https://careers.abbvie.com/en/jobs?ln=Romania&la=&lo=&lr=100&li=RO";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const items = res.findAll("div", { class: "attrax-vacancy-tile" });

  const jobs = [];

  for (const item of items) {
    let cities = [];
    let counties = [];
    const job_title = item
      .find("a", { class: "attrax-vacancy-tile__title" })
      .text.trim();
    const job_link =
      "https://careers.abbvie.com" +
      item.find("a", { class: "attrax-vacancy-tile__title" }).attrs.href;
    const country = "Romania";
    const locationContainer = item
      .find("div", {
        class: "attrax-vacancy-tile__location-freetext",
      })
      .findAll("p");

    const city = translate_city(
      locationContainer[locationContainer.length - 1].text.split(",")[0].trim()
    );
    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "Abbvie";
  const logo =
    "https://tbcdn.talentbrew.com/company/14/v2_0/img/abbvie-logo-color.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
