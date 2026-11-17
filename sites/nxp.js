const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
  const url = "https://nxp.wd116.myworkdayjobs.com/wday/cxs/nxp/careers/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://nxp.wd116.myworkdayjobs.com",
    Referer: "https://nxp.wd116.myworkdayjobs.com/en-US/careers",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  scraper.headers = scraper.config;
  const limit = 20;
  const data = {
    appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  let soup = await postWithRetry(scraper, data);
  const { total } = soup;
  const numberOfPages = Math.ceil(total / limit);

  const jobs = [];
  for (let i = 0; i < numberOfPages; i += 1) {
    if (i > 0) {
      data.offset = i * limit;
      soup = await postWithRetry(scraper, data);
    }
    const items = soup.jobPostings || [];
    for (const item of items) {
      const job_title = item.title;
      const job_link_prefix = "https://nxp.wd116.myworkdayjobs.com/en-US/careers";
      const job_link = job_link_prefix + item.externalPath;
      const separatorIndex = item.locationsText.indexOf(",");
      let city = translate_city(
        item.locationsText.substring(separatorIndex + 1)
      );

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
  const company = "NXP";
  const logo = "https://nxp.wd116.myworkdayjobs.com/careers/assets/logo";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
