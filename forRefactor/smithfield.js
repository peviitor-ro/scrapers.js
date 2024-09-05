const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url = "https://www.smithfield.ro/ro/cariere/posturi-disponibile";
  const jobs = [];
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");

  const items = res.find("div", { class: "jobs" }).findAll("div");

  for (const item of items) {
    const job_title = item.find("span", { class: "first" }).text.trim();
    const job_link = item.find("span", { class: "second" }).find("a")
      .attrs.href;

    const job = generateJob(
      job_title,
      job_link,
      "Romania",
      "Timisoara",
      "Timis"
    );
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Smithfield";
  const logo = "https://www.smithfield.ro/assets/app/images/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
