const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url = "https://qualitance.com/careers/";

  const scraper = new Scraper(url);

  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const items = soup.findAll("div", { class: "career-item-wrap" });

  for (const item of items) {
    const job_title = item.find("a").text.trim();
    const job_link = item.find("a").attrs.href;
    const job = generateJob(job_title, job_link, "Romania");
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Qualitance";
  const logo = "https://tech.qualitance.com/hubfs/logo_new_whitebg-01.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
