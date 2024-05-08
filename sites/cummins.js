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
    "https://cummins.jobs/rom/jobs/?offset=10&num_items=100&filter_path=%2Fjobs%2F";
  const scraper = new Scraper(url);
  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup.findAll("li", { class: "direct_joblisting" });

  await Promise.all(
    jobsElements.map(async (elem) => {
      const job_title = elem.find("a").text.trim();
      const job_link = "https://cummins.jobs" + elem.find("a").attrs.href;
      const city = elem
        .find("span", { class: "hiringPlace" })
        .text.split(",")[0]
        .trim()
        .split(" ");

      let cities = [];
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city[1])
      );

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", cities, counties);
      jobs.push(job);
    })
  );
  return jobs;
};

const run = async () => {
  const company = "Cummins";
  const logo = "https://dn9tckvz2rpxv.cloudfront.net/cummins/img4/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
