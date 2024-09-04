const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const Jssoup = require("jssoup").default;
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const additionalHeaders = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

const getJobs = async () => {
  const url =
    "https://en.jobs.sanofi.com/search-jobs/results?ActiveFacetID=798549&CurrentPage=1&RecordsPerPage=100&Distance=50&RadiusUnitType=0&ShowRadius=False&IsPagination=False&FacetType=0&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=13&FacetFilters%5B0%5D.Display=Romania&FacetFilters%5B0%5D.IsApplied=true&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=5&ResultsType=0";
  const scraper = new Scraper(url);

  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const res = await scraper.get_soup("JSON");

  const jobs = [];

  const soup = new Jssoup(res.results);

  const items = soup.findAll("ul")[1].findAll("li");

  for (const item of items) {
    const job_title = item.find("h2").text.trim();
    const job_link = "https://jobs.sanofi.com" + item.find("a").attrs.href;
    const location = translate_city(
      item.find("span", { class: "job-location" }).text.split(",")[0].trim()
    );

    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(location);

    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, "Romania", c, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Sanofi";
  const logo =
    "https://www.sanofi.ro/dam/jcr:9f06f321-3c2b-485f-8a84-b6c33badc56a/logo-header-color-large.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
