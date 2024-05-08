const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url = "https://www.conarg.co/ro/cariere/oportunitati-de-cariera.html";
  const scraper = new Scraper(url);
  const jobs = [];
  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup
    .find("article", { class: "wk-content" })
    .findAll("li");

  jobsElements.forEach((elem) => {
    const job_title = elem.find("h2").text.trim();
    const job_link = "https://www.conarg.co" + elem.find("a").attrs.href;
    const city = "Bucuresti";
    const county = "Bucuresti";
    const job = generateJob(job_title, job_link, "Romania", city, county);
    jobs.push(job);
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
