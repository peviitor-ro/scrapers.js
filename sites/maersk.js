const Jssoup = require("jssoup").default;
const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { findCity, translate_city, replace_char } = require("../utils.js");

const generateJob = (job_title, job_link, country, county, city) => ({
  job_title,
  job_link,
  country,
  county,
  city,
  remote: [],
});

const get_headers = async () => {
  url = "https://www.maersk.com/careers/vacancies/assets/3508041.js";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");
  const pattern = /var r={headers:{"Consumer-Key":"(.*?)"}/;
  const match = soup.text.match(pattern);
  return { "Consumer-Key": match[1] };
};

const getJobs = async () => {
  const url =
    "https://api.maersk.com/careers/vacancies?region=&category=&country=Romania&searchInput=&offset=0&limit=48&language=EN";
  const scraper = new Scraper(url);
  const additionalHeaders = await get_headers();
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const jobs_objects = res.results;
  const jobs = [];
  jobs_objects.forEach((job) => {
    const job_title = job.Title;
    const job_link = job.Url;
    const country = job.Country;

    let city = job.City;

    if (city !== null) {
      const { foudedTown, county } = getTownAndCounty(
        translate_city(replace_char(city.toLowerCase(), ["z"], ""))
      );
      jobs.push(generateJob(job_title, job_link, country, county, foudedTown));
    } else {
      const { foudedTown, county } = getTownAndCounty(
        findCity(replace_char(job_link, ["-", "/"], " "))
      );
      jobs.push(generateJob(job_title, job_link, country, county, foudedTown));
    }
  });

  return jobs;
};

const getParams = () => {
  const company = "Maersk";
  const logo = "https://jobsearch.maersk.com/jobposting/img/logo-colored.png";
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
