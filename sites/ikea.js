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
  const url =
    "https://jobs.ikea.com/en/search-jobs/Romania/22908/2/798549/46/25/50/2";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");

  const jobs = [];

  const jobsElements = soup.findAll("li", { class: "job-list__item" });

  jobsElements.forEach((job) => {
    const job_title = job.find("h3").text.replace("&#xA;", "").trim();
    const job_link = "https://jobs.ikea.com" + job.find("a").attrs.href;
    const city = job
      .find("span", { class: "job-list__location" })
      .text.split(",")[0]
      .trim();

    const { foudedTown, county } = getTownAndCounty(
      translate_city(city.toLowerCase())
    );

    jobs.push(generateJob(job_title, job_link, "Romania", county, foudedTown));
  });

  return jobs;
};

const getParams = () => {
  const company = "IKEA";
  const logo = "https://tbcdn.talentbrew.com/company/22908/img/logo/logo-10872-12036.png";
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

