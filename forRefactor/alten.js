const { Scraper, postApiPeViitor, range } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  let url = "https://careers.altenromania.ro/jds/1";
  const jobs = [];

  const scraper = new Scraper(url);
  let res = await scraper.get_soup("JSON");

  const pages = JSON.parse(res.success.message).pager.pageCount;

  for (let i = 1; i <= pages; i++) {
    const jobs_elements = JSON.parse(res.success.message).recordList;
    jobs_elements.forEach((job) => {
      const job_title = job.titlu;
      const job_link = "https://careers.altenromania.ro/job/" + job.id;
      const city = job.locatie;
      const remote = [];

      if (city === "Remote"){
        const city = "Romania";
        const county = "";
        remote.push("Remote");
        jobs.push(generateJob(job_title, job_link, city, county, remote));
      } else{
        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.toLowerCase())
        );
        jobs.push(generateJob(job_title, job_link, foudedTown, county, remote));
      }
    });
    url = "https://careers.altenromania.ro/jds/" + (i + 1);
    scraper.url = url;
    res = await scraper.get_soup("JSON");
  }

  return jobs;
};

const getParams = () => {
  const company = "Alten";
  const logo = "https://careers.altenromania.ro/assets/img/svgs/logo.svg";
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
