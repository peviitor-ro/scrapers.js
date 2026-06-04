const puppeteer = require("puppeteer");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { translate_city } = require("../utils.js");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const BASE_URL = "https://sii-group.com/en-FR/join-us?field_agency_target_id=7860";

const extractJobsFromPage = (page) =>
  page.evaluate(() => {
    const items = document.querySelectorAll(".views-row");
    const results = [];

    for (const item of items) {
      const linkEl = item.querySelector("a[href*='/en-FR/node/']");
      if (!linkEl) continue;

      const job_title = linkEl.querySelector("h3")?.textContent?.trim();
      if (!job_title) continue;

      const job_link = linkEl.href;

      const locationEl = item.querySelector(".field--name-field-location .field__item");
      const locationText = locationEl?.textContent?.trim() || "";

      results.push({ job_title, job_link, locationText });
    }

    return results;
  });

const getJobs = async () => {
  const jobs = [];
  let currentPage = 0;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  while (true) {
    const url = `${BASE_URL}&page=${currentPage}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const pageJobs = await extractJobsFromPage(page);
    if (pageJobs.length === 0) break;

    jobs.push(...pageJobs);
    currentPage++;
  }

  await browser.close();

  for (const job of jobs) {
    const locationText = job.locationText;
    let cities = [];
    let counties = [];
    let remote = [];

    if (locationText.toLowerCase().includes("remote")) {
      remote = ["remote"];
    } else if (locationText.toLowerCase().includes("hybrid")) {
      remote = ["hybrid"];
    } else {
      const rawCity = locationText.split(",")[0]?.trim() || locationText;
      const city = translate_city(rawCity);
      if (city) {
        const { city: c, county: co } = await _counties.getCounties(city);
        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
      }
    }

    job.cities = cities;
    job.counties = counties;
    job.remote = remote;
  }

  return jobs.map((j) =>
    generateJob(j.job_title, j.job_link, "Romania", j.cities, j.counties, j.remote),
  );
};

const run = async () => {
  const company = "SII";
  const logo =
    "https://www.siiromania.ro/wp-content/themes/corporate-sii-romania/img/logo.png";
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
