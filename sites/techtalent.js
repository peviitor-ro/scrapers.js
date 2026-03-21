const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://www.techtalent.ro/careers/";

const decodeHtml = (text) =>
  text
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&");

const getLocations = async (locationText) => {
  const normalized = locationText.trim();

  if (!normalized) {
    return { cities: [], counties: [], remote: [] };
  }

  if (
    normalized.toLowerCase() === "remote" ||
    normalized.toLowerCase() === "full remote"
  ) {
    return { cities: [], counties: [], remote: ["remote"] };
  }

  if (normalized === "Romania") {
    return {
      cities: ["Bucuresti", "Timisoara", "Cluj-Napoca", "Brasov"],
      counties: ["Bucuresti", "Timis", "Cluj", "Brasov"],
      remote: [],
    };
  }

  const locations = normalized.split("/").map((value) => value.trim());
  const cities = [];
  let counties = [];

  for (const location of locations) {
    const cityName = translate_city(location);
    const { city, county } = await _counties.getCounties(cityName);

    if (city) {
      cities.push(city);
      counties = [...new Set([...counties, ...county])];
    }
  }

  return {
    cities: [...new Set(cities)],
    counties,
    remote: [],
  };
};

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];
  const items = soup
    .findAll("div")
    .filter((div) => (div.attrs?.class || "").includes("job-box-wrapper"));

  for (const item of items) {
    const titleNode = item
      .findAll("div")
      .find((div) => (div.attrs?.class || "").includes("job-title line-title"));
    const linkNode = item.find("a");
    const locationNode = item
      .findAll("span")
      .find((span) => (span.attrs?.class || "").includes("job-si job-loc"));

    if (!titleNode || !linkNode || !locationNode) {
      continue;
    }

    const job_title = decodeHtml(titleNode.text.trim());
    const job_link = linkNode.attrs.href;
    const { cities, counties, remote } = await getLocations(
      locationNode.text.trim(),
    );

    jobs.push(
      generateJob(job_title, job_link, "Romania", cities, counties, remote),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "TechTalent";
  const logo = "https://www.techtalent.ro/wp-content/uploads/2021/02/logo.png";
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
