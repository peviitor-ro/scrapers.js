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
  const url = "https://www.leoni.com/jobs-career/jobs-portal";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const jobs = [];
  const jobElements = res.findAll("div", { class: "item-grid__tile" });

  for (const elem of jobElements) {
    const country = elem
      .find("p", { class: "icon--start-location_on" })
      .text.split(",")[1]
      .trim();
    if (country === "Romania") {
      const job_title = elem.find("h3").text.trim();
      const job_link = elem.find("a").attrs.href;
      const location = elem
        .find("p", { class: "icon--start-location_on" })
        .text.split(",")[0]
        .trim()
        .replace("Location:", "");
      const remote = elem
        .find("p", { class: "icon--start-work" })
        .text.trim()
        .replace("Type of job:", "")
        .toLowerCase().replace("onsite", "on-site");
      let cities = [];
      let counties = [];
      const city = translate_city(location);
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
      const job = generateJob(
        job_title,
        job_link,
        country,
        cities,
        counties,
        remote
      );
      jobs.push(job);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Leoni";
  const logo =
    "https://d1619fmrcx9c43.cloudfront.net/typo3conf/ext/leonisite/Resources/Public/Build/Images/logo-leoni.svg?1680705667";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
