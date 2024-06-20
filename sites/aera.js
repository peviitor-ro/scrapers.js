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
  const url = "https://www.aeratechnology.com/careers";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const items = res.find("div", { id: "open-roles" }).findAll("li");

  const jobs = [];

  for (const item of items) {
    const locatin = item.find("p", { class: "_1RSuWi9-4R" }).text.split(",");
    const country = locatin[locatin.length - 1].trim();

    if (country !== "Romania") {
      continue;
    }

    let cities = [];
    let counties = [];
    const job_title = item.find("h3").text.trim();
    const job_link = item.find("a").attrs.href;

    const city = locatin[0].trim();

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city)
    );
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
  const company = "Aera";
  const logo =
    "https://lever-client-logos.s3.amazonaws.com/dfa07fbc-23b8-4677-9df5-6bb3d39f07db-1511999864878.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
