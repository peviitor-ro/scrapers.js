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
  const url = "https://www.kontron.ro/Jobs.ro.html";
  const scraper = new Scraper(url);
  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const items = soup
    .find("ul", { class: "filtered-item-list__items" })
    .findAll("li");

  for (const job of items) {
    const job_title = job
      .find("div", { class: "filtered-item-list__items__item__title" })
      .find("a")
      .text.trim();
    const job_link =
      "https://www.kontron.ro" +
      job
        .find("div", { class: "filtered-item-list__items__item__title" })
        .find("a").attrs.href;
    const city = translate_city(
      job
        .find("div", { class: "filtered-item-list__items__item__location" })
        .find("a")
        .text.trim()
    );

    const { city: c, county: co } = await _counties.getCounties(city);

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "kontron";
  const logo = "https://www.kontron.ro/kontron_Logo-RGB-2C.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
