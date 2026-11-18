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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const postWithRetry = async (scraper, data, retries = 5) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await scraper.post(data);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(attempt * 3000);
      }
    }
  }
  throw lastError;
};

const getJobs = async () => {
  const url = "https://ag.wd3.myworkdayjobs.com/wday/cxs/ag/Airbus/jobs";
  const scraper = new Scraper(url);
  scraper.config.headers = {
    ...scraper.config.headers,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://ag.wd3.myworkdayjobs.com",
    Referer: "https://ag.wd3.myworkdayjobs.com/en-US/Airbus",
  };
  scraper.headers = scraper.config;

  let data = { appliedFacets: {}, limit: 20, offset: 0, searchText: "Romania" };
  const res = await postWithRetry(scraper, data);
  const totalJobs = res.total;
  const step = 20;

  const pages = range(0, totalJobs, step);

  const items = [];

  if (totalJobs > data.limit) {
    for (const page of pages) {
      data["offset"] = page;
      const res = await postWithRetry(scraper, data);
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
    const locationContainer = item.locationsText
      ? item.locationsText.split(",")
      : [];
    const city = translate_city(
      locationContainer[0].replace("Bucarest", "Bucuresti"),
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
  const logo = "https://ag.wd3.myworkdayjobs.com/Airbus/assets/logo";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
