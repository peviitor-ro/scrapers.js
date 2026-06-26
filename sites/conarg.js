const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJobs = async () => {
  const url = "https://conarg.co/cariere.html";
  const jobs = [];

  let soup;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const scraper = new Scraper(url);
      scraper.config.validateStatus = false;
      scraper.config.timeout = 15000;
      soup = await scraper.get_soup("HTML");
      break;
    } catch (e) {
      lastError = e;
      if (attempt < 2) await delay(3000);
    }
  }
  if (!soup) throw lastError;

  const jobsElements = soup.findAll("h3", { class: "el-title" });

  let jobId = 1;

  jobsElements.forEach((elem) => {
    const job_title = elem.text.trim();
    const job_link = url + `#${jobId}`;
    const job = generateJob(job_title, job_link, "Romania");
    jobs.push(job);

    jobId++;
  });

  return jobs;
};

const run = async () => {
  const company = "Conarg";
  const logo = "https://www.conarg.co/images/logo/conarg-logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
