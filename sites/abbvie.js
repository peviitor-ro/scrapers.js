const Jssoup = require("jssoup").default;
const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  const url =
    "https://careers.abbvie.com/en/search-jobs/results?ActiveFacetID=798549-683504&CurrentPage=1&RecordsPerPage=100&Distance=100&RadiusUnitType=0&ShowRadius=False&IsPagination=False&FacetTerm=798549&FacetType=2&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=7&FacetFilters%5B0%5D.Display=Romania&FacetFilters%5B0%5D.IsApplied=true&FacetFilters%5B0%5D.FieldName=&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=3&OrganizationIds=14&ResultsType=0";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "en-GB,en;q=0.9",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const html = res.results;
  const soup = new Jssoup(html);
  const items = soup.findAll("li", { class: "search-results__item" });
  const jobs = [];
  items.forEach((item) => {
    const job_title = item.find("h3").text.trim();
    const job_link = `https://careers.abbvie.com${
      item.find("a", { class: "search-results__job-link" }).attrs.href
    }`;
    const city = item
      .find("span", { class: "job-location" })
      .text.split(",")[0]
      .trim();
    const job = generateJob(job_title, job_link, city);
    jobs.push(job);
  });

  return jobs;
};

const getParams = () => {
  const company = "Abbvie";
  const logo =
    "https://tbcdn.talentbrew.com/company/14/v2_0/img/abbvie-logo-color.svg";
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

run(); // this will be called by our main.js job

module.exports = { getJobs, getParams }; // this is needed for our unit test job
