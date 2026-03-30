const puppeteer = require("puppeteer");
const { translate_city, get_jobtype } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://www.linkedin.com/jobs/search/?keywords=BearingPoint&location=Romania";
  const jobs = [];
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const linkedinJobs = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll(".base-search-card");

    cards.forEach((card) => {
      const titleEl = card.querySelector(".base-search-card__title");
      const subtitleEl = card.querySelector(".base-search-card__subtitle");
      const locationEl = card.querySelector(".job-search-card__location");
      const linkEl = card.querySelector(".base-search-card__info a");

      if (
        titleEl &&
        subtitleEl &&
        subtitleEl.textContent.includes("BearingPoint")
      ) {
        results.push({
          title: titleEl.textContent.trim(),
          company: subtitleEl.textContent.trim(),
          location: locationEl ? locationEl.textContent.trim() : "",
          link: linkEl ? linkEl.href : "",
        });
      }
    });
    return results;
  });

  await browser.close();

  for (const item of linkedinJobs) {
    const job_title = item.title;
    const job_link = item.link.split("?")[0];

    let remote = [];
    const location = item.location || "";
    const country = "Romania";
    const cities = [];
    let counties = [];

    const city = translate_city(location.split(",")[0].trim());
    if (city) {
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    const job = generateJob(
      job_title,
      job_link,
      country,
      cities,
      counties,
      remote,
    );
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "BearingPoint";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/BearingPoint_201x_logo.svg/800px-BearingPoint_201x_logo.svg.png?20161218212116";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
