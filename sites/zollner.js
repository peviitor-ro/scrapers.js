const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://jobs.b-ite.com/api/v1/postings/search";
const MANUAL_COUNTY_MAP = {
  "Satu Mare": ["Satu Mare"],
};
const DATA = {
  key: "46931c94b35f1165cae2df35cf4574a747be844e",
  channel: 0,
  locale: "ro",
  sort: { by: "title", order: "asc" },
  origin: "https://www.zollner.ro/ro/cariera/posturi-disponibile",
  page: { num: 1000, offset: 0 },
};

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["Content-Type"] = "application/json";
  scraper.config.headers.Origin = "https://www.zollner.ro";
  scraper.config.headers.Referer =
    "https://www.zollner.ro/ro/cariera/posturi-disponibile";

  const response = await scraper.post(DATA);
  const jobs = [];

  for (const job of response.jobPostings || []) {
    const cityName = translate_city(
      (job.jobSite || job.address?.city || "").trim(),
    );
    const { city, county } = await _counties.getCounties(cityName);
    const finalCounty = MANUAL_COUNTY_MAP[cityName] || county || [];

    jobs.push(
      generateJob(job.title, job.url, "Romania", city || cityName, finalCounty),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "Zollner";
  const logo =
    "https://www.zollner.ro/fileadmin/user_upload/00_Startseite/logo.svg";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
