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
  const urls = [
    "https://jobsearch.alstom.com/search/?q=&locationsearch=Romania",
    "https://career5.successfactors.eu/careers?company=ALSTOM&q=&locationsearch=Romania",
  ];

  for (const url of urls) {
    console.log(`Trying URL: ${url}`);
    try {
      const scraper = new Scraper(url);
      scraper.config.headers["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      let res;
      try {
        res = await scraper.get_soup("HTML");
      } catch (e) {
        console.log("get_soup failed, trying render_page...");
        res = await scraper.render_page();
      }

      const tbody = res.find("tbody");
      if (!tbody) {
        console.log("No tbody found, trying next URL...");
        continue;
      }

      const items = tbody.findAll("tr");
      if (items.length === 0) {
        console.log("No job rows found, trying next URL...");
        continue;
      }

      console.log(`Found ${items.length} jobs on ${url}`);
      return parseJobItems(items, url);
    } catch (error) {
      console.log(`Failed to fetch from ${url}:`, error.message);
      continue;
    }
  }

  console.log("All URLs failed. Returning empty list.");
  return [];
};

const parseJobItems = async (items, baseUrl) => {
  const jobs = [];
  for (const item of items) {
    try {
      let cities = [];
      let counties = [];
      const jobTitleElem = item.find("a");
      if (!jobTitleElem) continue;

      const job_title = jobTitleElem.text.trim();
      const job_link =
        baseUrl.replace(/\/search\/.*|\/careers.*/, "") +
        jobTitleElem.attrs.href;
      const country = "Romania";

      const locationSpan = item.find("span", { class: "jobLocation" });
      const cityText = locationSpan
        ? locationSpan.text.split(",")[0].trim()
        : "";
      const city = translate_city(cityText);

      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, country, cities, counties);
      jobs.push(job);
    } catch (e) {
      console.error("Error parsing job item:", e.message);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Alstom";
  const logo =
    "https://rmkcdn.successfactors.com/44ea18da/ff6f3396-32e1-421d-915a-5.jpg";
  const jobs = await getJobs();
  if (jobs.length === 0) {
    console.log("No jobs found from Alstom.");
    return;
  }
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
