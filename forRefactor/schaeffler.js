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
  const url =
    "https://jobs.schaeffler.com/search/?createNewAlert=false&q=&locationsearch=Romania&optionsFacetsDD_country=&optionsFacetsDD_customfield1=&optionsFacetsDD_shifttype=&optionsFacetsDD_lang=&optionsFacetsDD_customfield2=&optionsFacetsDD_customfield4=";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");

  const jobs = [];

  let pattern = /jobRecordsFound: parseInt\("(.*)"\)/g;

  const totalJobs = parseInt(res.text.match(pattern)[0].split('"')[1]);
  const steps = range(0, totalJobs, 100);

  for (const step of steps) {
    let url = `https://jobs.schaeffler.com/tile-search-results/?q=&locationsearch=Romania&startrow=${step}&_=1682543695317`;
    const s = await new Scraper(url);

    const res = await s.get_soup("HTML");

    const items = res.findAll("li", { class: "job-tile" });

    for (const item of items) {
      const job_title = item.find("a").text.trim();
      const job_link =
        "https://jobs.schaeffler.com" + item.find("a").attrs.href;
      const location = translate_city(
        item.find("div", { class: "city" }).find("div").text.trim()
      );

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(location);

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
  const company = "Schaeffler";
  const logo =
    "https://www.sanofi.ro/dam/jcr:9f06f321-3c2b-485f-8a84-b6c33badc56a/logo-header-color-large.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
