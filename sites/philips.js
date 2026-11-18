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
  const url =
    "https://philips.wd3.myworkdayjobs.com/wday/cxs/philips/jobs-and-careers/jobs";

  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://philips.wd3.myworkdayjobs.com",
    Referer: "https://philips.wd3.myworkdayjobs.com/en-US/jobs-and-careers",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  scraper.headers = scraper.config;
  const limit = 20;
  let data = {
    appliedFacets: { locationHierarchy1: ["6e1b2a934716103c2addacb847bf00cc"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  let soup = await postWithRetry(scraper, data);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total % limit === 0 ? total / limit : total / limit + 1,
  );
  const jobs = [];

  for (let i = 0; i < numberOfPages; i += 1) {
    let items = soup.jobPostings;
    for (const item of items) {
      const job_title = item.title;

      const job_link_prefix =
        "https://philips.wd3.myworkdayjobs.com/en-US/jobs-and-careers";
      const job_link = job_link_prefix + item.externalPath;

      const locationsText = item.locationsText || "";
      const separatorIndex = locationsText.indexOf(",");
      let city = "";

      if (separatorIndex !== -1) {
        city = translate_city(locationsText.substring(separatorIndex + 1));
      }

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        c,
        counties,
      );
      jobs.push(job_element);
    }
    data.offset = i * limit;
    soup = await postWithRetry(scraper, data);
  }
  return jobs;
};

const run = async () => {
  const company = "Philips";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/05/Phillips-Logo-500x281.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
