const { translate_city, get_jobtype } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://bearingpoint-romania.hirehive.com";
  const jobs = [];
  const scraper = new Scraper(url);
  const type = "HTML";
  const res = await scraper.get_soup(type);
  const elements = res.find("div", { class: "hh-jobs-openings" }).findAll("a");

  await Promise.all(
    elements.map(async (item) => {
      const job_title = item.find("h3").text.trim();
      const job_link =
        "https://bearingpoint-romania.hirehive.com" + item.attrs.href;
      let remote = [];
      const locations = item
        .find("div", { class: "hh-job-row-location" })
        .text.replace("and", ",")
        .trim()
        .split(",");

      const country = "Romania";
      const cities = [];
      let counties = [];

      await Promise.all(
        locations.map(async (location) => {
          const city = translate_city(location.trim());
          const { city: c, county: co } = await _counties.getCounties(city);
          if (c) {
            cities.push(c);
            counties = [...new Set([...counties, ...co])];
          }
        })
      );

      try {
        const remoteElement = locations[0].toLowerCase().trim();
        remote = get_jobtype(remoteElement);
      } catch (error) {}

      const job = generateJob(
        job_title,
        job_link,
        country,
        cities,
        counties,
        remote
      );
      jobs.push(job);
    })
  );
  return jobs;
};

const run = async () => {
  const company = "BearingPoint";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/BearingPoint_201x_logo.svg/800px-BearingPoint_201x_logo.svg.png?20161218212116";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job