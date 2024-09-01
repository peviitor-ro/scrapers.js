const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://corporate.pirelli.com/corporate/en-ww/careers/work-with-us?region=europe&country=romania&function=all";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const items = soup.findAll("div", {
    "data-country": "0c7d5ae44b2a0be9ebd7d6b9f7d60f20",
  });
  const jobs = [];
  for (const item of items) {
    const job_title = item.find("span").text.trim();
    const city = translate_city(
      item.find("span", { class: "loc" }).text.split(",")[0].trim()
    );
    const jumpTo = "#:~:text=";
    const job_link = url + jumpTo + job_title;

    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(city);

    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, "Romania", c, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Pirelli";
  const logo =
    "https://d2snyq93qb0udd.cloudfront.net/corporate/logo-pirelli2x.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
