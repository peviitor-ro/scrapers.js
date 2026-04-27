const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const API_URL = "https://amdaris.com/wp-json/wp/v2/pages/365996";

const ROMANIA_LOCATIONS = ["bucuresti", "timisoara", "romania"];

const getJobs = async () => {
  const scraper = new Scraper(API_URL);
  const res = await scraper.get_soup("JSON");

  const content = res.content.rendered;

  const jobCardRegex = /<div class="job-card"[^>]*data-href="([^"]*)"[^>]*>[\s\S]*?<h6 class="job-card__title">([^<]+)<\/h6>[\s\S]*?<span class="job-card__meta-item"[^>]*>[\s\S]*?<svg[^>]*>[\s\S]*?<\/svg>\s*([^<]+)<\/span>/g;

  const jobs = [];
  let match;
  while ((match = jobCardRegex.exec(content)) !== null) {
    const job_link = match[1];
    const job_title = match[2].trim().replace(/&amp;/g, "&");
    const locationText = match[3].trim();

    let location = "";
    if (locationText.toLowerCase().includes("bucure")) {
      location = "Bucuresti";
    } else if (locationText.toLowerCase().includes("timisoara")) {
      location = "Timisoara";
    } else if (locationText.toLowerCase() === "romania" || locationText.toLowerCase().includes(", romania")) {
      location = "Romania";
    }

    if (!job_title || !location || !ROMANIA_LOCATIONS.includes(location.toLowerCase())) {
      continue;
    }

    const finalJobLink = job_link.startsWith("http") ? job_link : "https://amdaris.com" + job_link;

    jobs.push(generateJob(job_title, finalJobLink, "Romania", location === "Romania" ? [] : [location], []));
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
