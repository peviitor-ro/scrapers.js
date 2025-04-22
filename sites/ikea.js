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
    "https://jobs.ikea.com/en/search-jobs/Romania/22908/2/798549/46/25/50/2";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");

  const jobs = [];

  const items = soup.findAll("li", { class: "job-list__item" });

  for (const job of items) {
    const job_title = job
      .find("span", { class: "job-list__title" })
      .text.replace("&#xA;", "")
      .trim();
    const job_link = "https://jobs.ikea.com" + job.find("a").attrs.href;
    const city = translate_city(
      job
        .find("span", { class: "job-list__location" })
        .text.split(",")[0]
        .trim()
    );

    const { city: c, county: co } = await _counties.getCounties(city);

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "IKEA";
  const logo =
    "https://tbcdn.talentbrew.com/company/22908/img/logo/logo-10872-12036.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
