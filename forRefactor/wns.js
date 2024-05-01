const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  const url =
    "https://careers.smartrecruiters.com/WNSGlobalServices144?search=romania";
  const jobs = [];
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");
  const items = res
    .find("div", { class: "js-openings-load" })
    .findAll("section");

  items.forEach((item) => {
    let city = item
      .find("h3", { class: "title" })
      .text.replace(",", "")
      .split(" ")[0];
    if (city.includes("Bucharest")) {
      city = "Bucuresti";
    }
    const { foudedTown, county } = getTownAndCounty(city);

    const jobsElements = item.findAll("li", { class: "opening-job" });
    jobsElements.forEach((job) => {
      const job_title = job.find("h4", { class: "details-title" }).text.trim();
      const job_link = job.find("a").attrs.href;
      let remote = job.find("p", { class: "job-desc" }).text.trim();

      if (remote.includes("Remote") || remote.includes("Hybrid")) {
        remote = remote.includes("Remote") ? "Remote" : "Hybrid";
      } else {
        remote = [];
      }

      jobs.push(generateJob(job_title, job_link, foudedTown, county, remote));
    });
  });
  return jobs;
};

const getParams = () => {
  const company = "WNS";
  const logo =
    "https://www.wnscareers.com/Portals/0/logo.png?ver=2020-02-03-150252-400";
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
