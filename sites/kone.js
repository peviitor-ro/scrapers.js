const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url = "https://kone.wd3.myworkdayjobs.com/wday/cxs/kone/Careers/jobs";
  const scraper = new Scraper(url);
  const body = {
    appliedFacets: { Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  const res = await scraper.post(body);

  const jobs = [];

  const items = res.jobPostings;

  for (const job of items) {
    const job_title = job.title;
    const job_link = "https://kone.wd3.myworkdayjobs.com/en-US/Careers" + job.externalPath;
    const city = "Bucuresti";

    const job_element = generateJob(job_title, job_link, "Romania", city, "Bucuresti");

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Kone";
  const logo = "https://kone.wd3.myworkdayjobs.com/Careers/assets/logo";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job