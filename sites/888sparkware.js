const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://888sparkware.ro";
  const scraper = new Scraper(url);

  let res;
  try {
    res = await scraper.get_soup("HTML");
  } catch (error) {
    console.error(`Failed to fetch jobs from ${url}: ${error.message}`);
    return [];
  }

  const items = res.findAll("div", { class: "position-container" });

  const jobs = [];

  for (const item of items) {
    let cities = [];
    let counties = [];
    const job_title = item.find("div", { class: "position-title" }).text.trim();
    const job_link = item.find("a", { class: "position-link" }).attrs.href;
    const country = "Romania";
    const city = item.find("div", { class: "position-location" }).text.trim();

    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "888sparkware";
  const logo =
    "https://888sparkware.ro/wp-content/uploads/2020/06/Sparkware_black_horizontal.png";
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

module.exports = { run, getJobs, getParams };
