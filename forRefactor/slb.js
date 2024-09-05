const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://careers.slb.com/job-listing";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const jobs = [];

  try {
    const items = res
      .find("table", { id: "jobsTable" })
      .find("tbody")
      .findAll("tr");

    for (const item of items) {
      const country = item.findAll("td")[3].text.trim();

      if (country == "Romania") {
        const job_title = item.find("a").text.trim();
        let link = item.find("a").attrs.href;
        let job_link = "";

        if (link.includes("https")) {
          job_link = link.replace(/;/g, "&");
        } else {
          job_link = "https://careers.slb.com" + item.find("a").attrs.href;
        }

        const city = translate_city(item.findAll("td")[2].text.trim());

        let counties = [];

        const { city: c, county: co } = _counties.getCounties(city);

        if (c) {
          counties = [...new Set([...counties, ...co])];
        }

        if (job_title) {
          const job = generateJob(job_title, job_link, "Romania", c, counties);
          jobs.push(job);
        }
      }
    }
  } catch (error) {}

  return jobs;
};

const run = async () => {
  const company = "SLB";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/SLB_Logo_2022.svg/1024px-SLB_Logo_2022.svg.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
