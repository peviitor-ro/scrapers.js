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
  const url = "https://jobsearch.alstom.com/search/?q=&locationsearch=Romania";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const totalJobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  const step = 25;

  const pages = range(0, totalJobs, step);

  const items = [];

  if (totalJobs > step) {
    for (const page of pages) {
      const url = `https://jobsearch.alstom.com/search/?q=&locationsearch=Romania&startrow=${page}`;
      const scraper = new Scraper(url);
      const res = await scraper.get_soup("HTML");
      items.push(...res.find("tbody").findAll("tr"));
    }
  } else {
    items.push(...res.find("tbody").findAll("tr"));
  }

  const jobs = [];

  for (const item of items) {
    let cities = [];
    let counties = [];
    const job_title = item.find("a").text.trim();
    const job_link = "https://jobsearch.alstom.com" + item.find("a").attrs.href;
    const country = "Romania";
    const city = translate_city(
      item.find("span", { class: "jobLocation" }).text.split(",")[0].trim()
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
  const company = "Alstom";
  const logo =
    "https://rmkcdn.successfactors.com/44ea18da/ff6f3396-32e1-421d-915a-5.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
