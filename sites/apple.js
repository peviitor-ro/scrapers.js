const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://jobs.apple.com/ro-ro/search?location=romania-ROMC";
const BASE_URL = "https://jobs.apple.com";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];

  const noresults = soup.find("div", { id: "no-search-results" });
  if (noresults) {
    return jobs;
  }

  const items = soup
    .findAll("div")
    .filter((item) => item.attrs?.id?.startsWith("search-search-job-title-"));

  for (const item of items) {
    const titleLink = item.find("a");
    const locationContainer = item
      .findAll("div")
      .find((div) => div.attrs?.class?.includes("job-title-location"));
    const locationText = locationContainer
      ?.findAll("span")
      ?.find((span) =>
        span.attrs?.id?.startsWith("search-store-name-container-"),
      )
      ?.text.trim();

    if (!titleLink || !locationText) {
      continue;
    }

    const job_title = titleLink.text.trim();
    const job_link = `${BASE_URL}${titleLink.attrs.href}`;
    const city = translate_city(locationText);

    let cities = [];
    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
  }

  return jobs;
};

const run = async () => {
  const company = "Apple";
  const logo = "https://www.apple.com/apple-touch-icon.png";
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
