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
  const url = "https://ag.wd3.myworkdayjobs.com/wday/cxs/ag/Airbus/jobs";
  const scraper = new Scraper(url);
  scraper.config.headers["Content-Type"] = "application/json";
  scraper.config.headers["Accept"] = "application/json";

  let data = { appliedFacets: {}, limit: 20, offset: 0, searchText: "Romania" };
  const res = await scraper.post(data);
  const totalJobs = res.total;
  const step = 20;

  const pages = range(0, totalJobs, step);

  const items = [];

  if (totalJobs > data.limit) {
    for (const page of pages) {
      data["offset"] = page;
      const res = await scraper.post(data);
      items.push(...res.jobPostings);
    }
  } else {
    items.push(...res.jobPostings);
  }

  const jobs = [];

  for (const item of items) {
    let cities = [];
    let counties = [];
    const job_title = item.title;
    const job_link =
      "https://ag.wd3.myworkdayjobs.com/en-US/Airbus" + item.externalPath;
    const country = "Romania";
    const locationContainer = item.locationsText.split(",");
    const city = translate_city(
      locationContainer[0].replace("Bucarest", "Bucuresti")
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
  const company = "Airbus";
  const logo =
    "https://brand.airbus.com/sites/g/files/jlcbta121/files/styles/airbus_480x480/public/2021-06/logo_blue.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
