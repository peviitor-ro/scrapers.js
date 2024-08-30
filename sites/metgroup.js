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
    "https://api.smartrecruiters.com/v1/companies/metgroup/postings?limit=100&country=ro";
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("JSON");

  const jobs = [];

  const items = res.content;

  for (const item of items) {
    const job_title = item.name;
    const job_link = "https://jobs.smartrecruiters.com/METGroup/" + item.id;
    const city = item.location.city;

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city)
    );

    let counties = [];
    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job_element = generateJob(
      job_title,
      job_link,
      "Romania",
      c,
      counties
    );
    jobs.push(job_element);
  }
  console.log(jobs);
  return jobs;
};

const run = async () => {
  const company = "METGroup";
  const logo = "https://group.met.com/media/3f4d1h1o/met-logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
