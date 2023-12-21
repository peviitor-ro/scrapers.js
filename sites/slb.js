const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city, replace_char } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  const url = "https://careers.slb.com/job-listing";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const jobs = [];

  try {
    const jobs_objects = res
      .find("table", { id: "jobsTable" })
      .find("tbody")
      .findAll("tr");

    jobs_objects.forEach((job) => {
      const country = job.findAll("td")[3].text.trim();

      if (country == "Romania") {
        const job_title = job.find("a").text.trim();
        let link = job.find("a").attrs.href;
        let job_link = "";

        if (link.includes("https")) {
          job_link = link.replace(/;/g, "&");
        } else {
          job_link = "https://careers.slb.com" + job.find("a").attrs.href;
        }

        const city = job.findAll("td")[2].text.trim();
        const { foudedTown, county } = getTownAndCounty(
          translate_city(replace_char(city.toLowerCase(), ["-"], " "))
        );

        if (job_title) {
          jobs.push(generateJob(job_title, job_link, foudedTown, county, []));
        }
      }
    });
  } catch (error) {}

  return jobs;
};

const getParams = () => {
  const company = "SLB";
  const logo = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/SLB_Logo_2022.svg/1024px-SLB_Logo_2022.svg.png";
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
