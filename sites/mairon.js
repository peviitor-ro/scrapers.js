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
  const url = "https://cariere.mairon.ro";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const jobs = [];

  const items = res
    .find("div", { id: "jobs_list" })
    .findAll("div", { class: "col-md-9" });

  for (const job of items) {
    const job_title = job.find("h3").text.trim();
    const job_link = job.find("a").attrs.href;
    const city = job.find("p").text.trim();

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city)
    );

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Mairon";
  const logo =
    "https://www.mairon.ro/wp-content/uploads/2019/06/logo-mairon.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
