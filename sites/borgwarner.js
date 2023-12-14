const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  const url =
    "https://www.borgwarner.com/careers/job-search?indexCatalogue=default&wordsMode=0&1Country=Romania";
  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const jobs_objects = res.findAll("div", { class: "widget-block" });

  jobs_objects.forEach((job) => {
    try {
      const job_title = job.find("h3").text.trim();
      const job_link = "https://www.borgwarner.com" + job.find("a").attrs.href;
      const city = job
        .find("p", { class: "bw-global-list-p" })
        .text.split("-")[0]
        .trim();
      const { foudedTown, county } = getTownAndCounty(
        translate_city(city.toLowerCase())
      );
      if (foudedTown && county) {
        jobs.push(generateJob(job_title, job_link, foudedTown, county, []));
      }
    } catch (error) {}
  });

  return jobs;
};

const getParams = () => {
  const company = "BorgWarner";
  const logo =
    "https://www.tyrepress.com/wp-content/uploads/2023/06/borgwarner-logo-550x191.png";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs_objects = await getJobs();
  const params = getParams();
  postApiPeViitor(jobs_objects, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
