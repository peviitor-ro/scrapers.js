const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://amdaris.com/jobs/";
const LOCATION_MAP = {
  bucharest: "Bucuresti",
  timisoara: "Timisoara",
};
const decodeHtml = (text) =>
  text.replace(/&#038;/g, "&").replace(/&amp;/g, "&");

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const res = await scraper.get_soup("HTML");

  const jobs = [];
  const items = res
    .find("table", { id: "jobs-data-table" })
    .find("tbody")
    .findAll("tr");

  for (const item of items) {
    const location = item.find("td", { class: "country-role" })?.text.trim();

    if (
      !location ||
      !["bucharest", "timisoara", "romania"].includes(location.toLowerCase())
    ) {
      continue;
    }

    const titleNode = item.find("a");

    if (!titleNode) {
      continue;
    }

    const job_title = decodeHtml(titleNode.text.trim());
    const job_link = titleNode.attrs.href;
    const normalizedLocation = LOCATION_MAP[location.toLowerCase()] || location;
    const city = translate_city(normalizedLocation);

    let counties = [];
    let finalCity = [];

    if (location.toLowerCase() !== "romania") {
      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        finalCity = c;
        counties = [...new Set([...counties, ...co])];
      }
    }

    jobs.push(generateJob(job_title, job_link, "Romania", finalCity, counties));
  }

  return jobs;
};

const run = async () => {
  const company = "Amdaris";
  const logo =
    "https://amdaris.com/wp-content/themes/amdaris/icons/logos/amdaris_logo_blue_insight.svg";
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
