const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url = "https://conarg.co/cariere.html";
  const scraper = new Scraper(url);
  const jobs = [];
  const soup = await scraper.get_soup("HTML");

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
  const logo = "http://www.conarg.co/images/logo/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
