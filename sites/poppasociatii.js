const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://www.p-a.ro/cariere/";

  const scraper = new Scraper(url);

  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const items = soup.findAll("div", { class: "post-wrap" });

  for (const item of items) {
    const job_title = item.find("a").text.trim();
    const job_link = item.find("a").attrs.href;

    const job = generateJob(job_title, job_link, "Romania", "Bucuresti", "Bucuresti");
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "PoppAsociatii";
  const logo = "https://www.p-a.ro/wp-content/themes/pa/images/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job