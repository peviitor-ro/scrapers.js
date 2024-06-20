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
    "https://careers.coca-colahellenic.com/ro_RO/careers/SearchJobs/?1293=%5B6003%5D&1293_format=2880&listFilterMode=1&projectRecordsPerPage=50";

  const jobs = [];
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const jobObject = res.findAll("div", { class: "article__header__text" });

  for (const elem of jobObject) {
    const job_title = elem.find("a").text.trim();
    const job_link = elem.find("a").attrs.href;
    const cityArray =
      elem
        .find("span", { class: "list-item" })
        ?.text.trim()
        .match(/\((.*?)\)/) || [];

    let cities = [];
    let counties = [];
    let remote = [];

    if (cityArray && cityArray.length >= 2) {
      const city = translate_city(cityArray[1].replace("-", " "));
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
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
  const company = "CocaColaHBC";
  const logo = "https://careers.coca-colahellenic.com/portal/5/images/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
