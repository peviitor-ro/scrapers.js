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
    "https://cariere.groupama.ro/search/?createNewAlert=false&q=&locationsearch=";

  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const totalJobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  const pages = Math.ceil(totalJobs / 10);

  for (let i = 0; i < pages; i++) {
    let url = `https://cariere.groupama.ro/search/?q=&sortColumn=referencedate&sortDirection=desc&startrow=${i * 10}`;

    const scraper = new Scraper(url);
    const response = await scraper.get_soup("HTML");
    const items = response.find("tbody").findAll("tr");

    for (const job of items) {
      const job_title = job.find("a").text.trim();
      const job_link = `https://cariere.groupama.ro${job.find("a").attrs.href}`;
      const city = translate_city(
        job.find("span", { class: "jobLocation" }).text.trim()
      );
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
  const company = "Groupama";
  const logo =
    "https://rmkcdn.successfactors.com/7c4eacca/683454b7-da0a-40a0-a1c9-a.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };