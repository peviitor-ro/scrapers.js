const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL =
  "https://www.ssi-schaefer.com/service/vacancysearch/ro-ro/1319586?query=&locations=&modesOfEmployment=&taskArea=&sortcriteria=";

const getLocations = async (locationText) => {
  const cities = [];
  let counties = [];
  const remote = [];

  for (const part of locationText.split(",").map((value) => value.trim())) {
    if (!part) {
      continue;
    }

    if (part.toLowerCase() === "hybrid") {
      remote.push("hybrid");
      continue;
    }

    const { city, county } = await _counties.getCounties(translate_city(part));

    if (city) {
      cities.push(city);
      counties = [...new Set([...counties, ...county])];
    }
  }

  return {
    cities: [...new Set(cities)],
    counties,
    remote: [...new Set(remote)],
  };
};

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];
  const items = soup.findAll("div", { class: "result" });

  for (const item of items) {
    const titleNode = item.find("h3", { class: "heading-2" });
    const linkNode = item.find("a", { class: "result__link" });
    const locationText = item.find("div", { class: "job-list-location" })?.text;

    if (!titleNode || !linkNode || !locationText) {
      continue;
    }

    const job_title = titleNode.text.trim();
    const job_link = `https://www.ssi-schaefer.com${linkNode.attrs.href}`;
    const cleanedLocation = locationText.replace("Locaţii:", "").trim();
    const { cities, counties, remote } = await getLocations(cleanedLocation);

    jobs.push(
      generateJob(job_title, job_link, "Romania", cities, counties, remote),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "SSISchaefer";
  const logo =
    "https://www.ssi-schaefer.com/resource/crblob/480/a14c9a665a8272cc2b80687168a2e3d7/logo-ssi-schaefer-svg-data.svg";
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
