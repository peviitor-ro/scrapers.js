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
  let url = "https://jobs.continental.com/en/api/result-list/pagetype-jobs/";

  const jobs = [];

  const scraper = new Scraper(url);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  const data = {
    "tx_conjobs_api[filter][location]":
      '{"title":"Romania","type":"country","countryCode":"ro"}',
    "tx_conjobs_api[itemsPerPage]": 200,
    "tx_conjobs_api[currentPage]": 1,
  };

  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }
  const res = await scraper.post(formData);

  const totalPages = res.result.pagination.pagesCount;

  const fetchData = async () => {
    let jobs = [];
    for (let i = 1; i <= totalPages; i++) {
      data["tx_conjobs_api[currentPage]"] = i;

      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }

      const res = await scraper.post(formData);
      res.result.list.forEach((job) => {
        jobs.push(job);
      });
    }
    return jobs;
  };

  const jobsData = await fetchData();

  for (const elem of jobsData) {
    const job_title = elem.title;
    const job_link =
      "https://jobs.continental.com/en/detail-page/job-detail/" + elem.url;
    const city = elem.cityLabel;
    const country = elem.countryLabel;

    let cities = [];
    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city.trim())
    );

    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Continental";
  const logo =
    "https://cdn.continental.com/fileadmin/_processed_/3/b/csm_continental_20logo-1920x1080_247d99d89e.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
