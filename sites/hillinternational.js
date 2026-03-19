const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://www.hill-international.com/en-RO/vacancies";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];
  const list = soup.find("ul", { class: "job-list" });

  if (!list) {
    return jobs;
  }

  const items = list.findAll("li");

  for (const item of items) {
    const titleNode = item.find("h2");
    const linkNode = item.find("a");
    const locationText = item
      .find("div", { class: "field-location" })
      ?.text.trim();

    if (!titleNode || !linkNode || !locationText) {
      continue;
    }

    const job_title = titleNode.text.trim();
    const job_link = `https://www.hill-international.com/${linkNode.attrs.href}`;
    const cityLabel = locationText.split(",").pop()?.trim();
    const city = translate_city(cityLabel);

    let cities = [];
    let counties = [];

    if (city) {
      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
  }

  return jobs;
};

const run = async () => {
  const company = "HillInternational";
  const logo =
    "https://www.iletisimofisi.com/wp-content/uploads/2019/01/hill-international-logo.jpg";
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
