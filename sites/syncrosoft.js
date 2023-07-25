const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  city: "Craiova", // HQ location but might be remote?
});

const getJobs = async () => {
  const url = "https://www.sync.ro/jobs.html";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const divs = soup.findAll("div", { class: "job_title" });
  const jobs = [];
  divs.forEach((div) => {
    const job_title = div.text.replace(" New", "");
    const jumpTo = "#:~:text="; // all jobs are on same page -> we simply jump to the element containing the job name
    const href = job_title.split(" ").join("%20");
    const job_link = url + jumpTo + href;
    const job = generateJob(job_title, job_link);
    jobs.push(job);
  });
  return jobs;
};

const getParams = () => {
  const company = "SyncROSoft";
  const logo =
    "https://www.sync.ro/oxygen-webhelp/template/resources/img/logo_syncrosoft.png";
  const apikey = process.env.COSTIN;
  const params = {
    company,
    logo,
    apikey,
  };
  return params
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  await postApiPeViitor(jobs, params);
};

run(); // this will be called by our main.js job

module.exports = { getJobs, getParams }; // this is needed for our unit test job
