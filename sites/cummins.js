const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, country, county, city) => ({
  job_title,
  job_link,
  country,
  county,
  city,
  remote: [],
});

const getJobs = async () => {
  const url = "https://cummins.jobs/rom/jobs/?offset=10&num_items=100&filter_path=%2Fjobs%2F";
  const scraper = new Scraper(url);
  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup.findAll("li", { class: "direct_joblisting" });

  jobsElements.forEach((job) => {
    const job_title = job.find("a").text.trim();
    const job_link = "https://cummins.jobs" + job.find("a").attrs.href;
    const city = job
      .find("span", { class: "hiringPlace" })
      .text.split(",")[0]
      .trim().split(" ")

      if (city.length > 1) {
        jobs.push(generateJob(job_title, job_link, "Romania", city[0], city[1]));
      } else {
        const { foudedTown, county } = getTownAndCounty(translate_city(city[0].toLowerCase()));
        jobs.push(generateJob(job_title, job_link, "Romania", county, foudedTown));
      }
  });

  return jobs;
};

const getParams = () => {
  const company = "Cummins";
  const logo = "https://dn9tckvz2rpxv.cloudfront.net/cummins/img4/logo.svg";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job