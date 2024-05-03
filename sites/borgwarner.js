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
    "https://www.borgwarner.com/careers/job-search?indexCatalogue=default&wordsMode=0&1Country=Romania&country=romania";
  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const elements = res.findAll("div", { class: "widget-block" });

  await Promise.all(
    elements.map(async (elem) => {
      try {
        const job_title = elem
          .find("span", { class: "bw-global-list-h3" })
          .text.trim();
        const job_link = elem
          .find("a", { class: "link" })
          .attrs.href.replace(/&amp;/g, "&");
        const city = translate_city(
          elem
            .find("p", { class: "bw-global-list-p" })
            .text.split("-")[0]
            .trim()
        );

        let cities = [];
        let counties = [];

        const { city: c, county: co } = await _counties.getCounties(city);
        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }

        const job = generateJob(
          job_title,
          job_link,
          "Romania",
          cities,
          counties
        );
        jobs.push(job);
      } catch (error) {}
    })
  );
  return jobs;
};

const run = async () => {
  const company = "BorgWarner";
  const logo =
    "https://www.tyrepress.com/wp-content/uploads/2023/06/borgwarner-logo-550x191.png";
  const elements = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(elements, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
