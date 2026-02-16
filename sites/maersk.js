const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const get_headers = async () => {
  const url = "https://www.maersk.com/careers/_nuxt/BOKWt41Y.js";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");
  const pattern = /t\s*=\s*"([^"]+)"/g;
  const match = soup.text.match(pattern)
  const lastMatch = match[3].match(/"([^"]+)"/);
  return { "Consumer-Key": lastMatch[1] };
};

const getJobs = async () => {
  const url =
    "https://api.maersk.com/careers/vacancies?country=Romania&isLocationDenied=true&limit=24&offset=0&language=EN&currentPage=1&resultcurrentPage=1&isResultPage=false&isRadiusDisabled=true&distance=0";
  const scraper = new Scraper(url);
  const additionalHeaders = await get_headers();
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const items = res.Results;
  const jobs = [];

  for (const job of items) {
    const job_link = job.Url;
    if (job_link) {
      const job_title = job.Title;
      const country = job.Country;

      const city = job.City ? job.City : "";
      let job_element = { job_title, job_link, country, city };

      if (city) {
        const { city: c, county: co } = await _counties.getCounties(
          translate_city(city)
        );
        job_element = generateJob(job_title, job_link, country, c, co);
      }

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Maersk";
  const logo = "https://jobsearch.maersk.com/jobposting/img/logo-colored.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test jobxX
