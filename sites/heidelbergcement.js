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
    " https://www.heidelbergmaterials.ro/ro/anunturi-de-angajare?field_job_offer_entry_level=16&field_job_offer_contract_type=13";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const total_jobs = soup
    .find("p", { class: "hc-title" })
    .text.trim()
    .split(" ")[0];

  const step = 10;
  const numberPages = Math.ceil(total_jobs / step);

  let jobs = [];
  for (let i = 0; i < numberPages; i++) {
    const url = `https://www.heidelbergmaterials.ro/ro/anunturi-de-angajare?field_job_offer_entry_level=16&field_job_offer_contract_type=13&page=${i}`;
    const s = new Scraper(url);
    const soup = await s.get_soup(type);
    const results = soup
      .find("div", { class: "hc-search-list" })
      .findAll("div", { class: "hc-teaser__content" });

    for (const job of results) {
      const job_title = job.find("a", { class: "hc-link" }).text.trim();
      const job_link =
        "https://www.heidelbergmaterials.ro" + job.find("a").attrs.href;
      const locations = job.find("ul").findAll("li")[2].text.split(" ");
      const city = translate_city(locations[locations.length - 1]);
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        c,
        counties
      );

      jobs.push(job_element);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "HeidelbergCement";
  const logo =
    "https://www.heidelbergmaterials.ro/sites/default/files/logo/HeidelbergMaterials.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
