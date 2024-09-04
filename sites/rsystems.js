const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  let url = "https://eu.rsystems.com/category/careers/romania-bucharest/";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.findAll("div", { class: "uael-post__inner-wrap" });

  for (const item of items) {
    const job_title = item.find("h3").text.trim();
    const job_link = item.find("a").attrs.href;
    const city = "Bucuresti";
    const county = "Bucuresti";

    jobs.push(generateJob(job_title, job_link, city, county));
  };
  return jobs;
};

const run = async () => {
  const company = "RSystems";
  const logo =
    "https://eu.rsystems.com/wp-content/uploads/2021/01/R-Systems-EUROPE-Blue-new.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
