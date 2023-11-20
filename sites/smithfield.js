const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  city: "Timisoara",
  county: "Timis",
  remote: [],
});

const getJobs = async () => {
  const url = "https://www.smithfield.ro/ro/cariere/posturi-disponibile";
  const jobs = [];
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");

  const jobsElements = res.find("div", { class: "jobs" }).findAll("div");

  jobsElements.forEach((job) => {
    const job_title = job.find("span", { class: "first" }).text.trim();
    const job_link = job.find("span", { class: "second" }).find("a").attrs.href;

    jobs.push(generateJob(job_title, job_link));
  });

  return jobs;
};

const getParams = () => {
  const company = "Smithfield";
  const logo =
    "https://www.smithfield.ro/assets/app/images/logo.png";
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
