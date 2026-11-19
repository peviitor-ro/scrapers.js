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
    "https://adient.wd3.myworkdayjobs.com/wday/cxs/adient/External/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://adient.wd3.myworkdayjobs.com",
    Referer: "https://adient.wd3.myworkdayjobs.com/en-US/External",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  scraper.headers = scraper.config;
  const limit = 20;
  const data = {
    appliedFacets: {},
    limit,
    offset: 0,
    searchText: "",
  };
  let soup = await postWithRetry(scraper, data);
  const countryFacet = (soup.facets || []).find(
    (facet) => facet.facetParameter === "Location_Country"
  );
  const romania = (countryFacet ? countryFacet.values : []).find((value) =>
    /romania/i.test(value.descriptor)
  );
  if (countryFacet && !romania) return [];
  if (romania) {
    data.appliedFacets = { Location_Country: [romania.id] };
    soup = await postWithRetry(scraper, data);
  }
  const { total } = soup;
  const numberOfPages = Math.floor(
    total % limit === 0 ? total / limit : total / limit + 1
  );
  const jobs = [];
  for (let i = 0; i < numberOfPages; i += 1) {
    if (i > 0) {
      data.offset = i * limit;
      soup = await postWithRetry(scraper, data);
    }
    const { jobPostings } = soup;

    for (const job of jobPostings) {
      if (!romania && !/romania/i.test(job.locationsText)) continue;
      const job_title = job.title;

      const job_link_prefix =
        "https://adient.wd3.myworkdayjobs.com/en-US/External";
      const job_link = job_link_prefix + job.externalPath;

      const separatorIndex = job.locationsText.indexOf(",");
      const city = translate_city(job.locationsText.substring(separatorIndex + 1));

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
        counties
      );
      jobs.push(job_element);
    };
  };
  return jobs;
};

const run = async () => {
  const company = "Adient";
  const logo =
    "https://www.adient.com/wp-content/uploads/2021/09/Adient_Logo.png";
  const jobs = await getJobs();
  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}`);
    return;
  }
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
