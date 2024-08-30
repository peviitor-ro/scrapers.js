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
  const url = "https://amdaris.com/jobs/";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const jobs = [];

  const items = res
    .find("table", { id: "jobs-data-table" })
    .find("tbody")
    .findAll("tr");

  for (const item of items) {
    const location = item.find("td", { class: "country-role" }).text.trim();

    if (
      ["bucharest", "timisoara", "romania"].includes(location.toLowerCase())
    ) {
      const job_title = item.find("a").text.trim();
      const job_link = item.find("a").attrs.href;
      const city = translate_city(location);

      const { city: c, county: co } = await _counties.getCounties(city);
      let counties = [];

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Amdaris";
  const logo =
    "https://amdaris.com/wp-content/themes/amdaris/icons/logos/amdaris_logo_blue_insight.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
