const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://www.pentasia.com/_sf/api/v1/jobs/search.json";

  const body = {
    job_search: {
      query: "Romania",
      location: {
        address: "",
        radius: 0,
        region: "UK",
        radius_units: "miles",
      },
      filters: {},
      commute_filter: {},
      offset: 0,
      jobs_per_page: 100,
    },
  };

  const scraper = new Scraper(url);

  const headers = {
    "Content-Type": "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...headers };

  const res = await scraper.post(body);
  const items = res.results;

  const jobs = [];

  for (const item of items) {
    const job_title = item.job.title;
    const job_link = "https://www.pentasia.com/jobs/" + item.job.url_slug;
    const city = "Bucuresti";
    const county = "Bucuresti";
    const remote = ["remote"];

    const job = generateJob(
      job_title,
      job_link,
      "Romania",
      city,
      county,
      remote
    );
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Pentasia";
  const logo =
    "https://media.newjobs.com/clu/xpen/xpentasiaiex/branding/89914/PENTASIA-LIMITED-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
