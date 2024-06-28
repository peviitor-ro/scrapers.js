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
    "https://careers.loreal.com/en_US/jobs/SearchJobsAJAX/?3_110_3=18058";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const jobs = [];

  const items = res.findAll("div", { class: "article__header__text" });

  for (const job of items) {
    const job_title = job.find("a").text.trim();
    const job_link = job.find("a").attrs.href;
    const city = job
      .find("div", { class: "article__header__text__subtitle" })
      .findAll("span")[0]
      .text.trim()
      .split(" ")[0];

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city.toLowerCase())
    );

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Loreal";
  const logo =
    "https://logos-world.net/wp-content/uploads/2020/04/LOreal-Logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
