const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const { translate_city } = require("../utils.js");
const { Counties } = require("../getTownAndCounty.js");

const JSSoup = require("jssoup").default;

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://careers.ing.com/en/search-jobs/results?ActiveFacetID=0&CurrentPage=1&RecordsPerPage=1000&TotalContentResults=&Distance=50&RadiusUnitType=1&Keywords=&Location=Romania&Latitude=46.00000&Longitude=25.00000&ShowRadius=False&IsPagination=False&CustomFacetName=&FacetTerm=&FacetType=0&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=1&LocationType=2&LocationPath=798549&OrganizationIds=2618&PostalCode=&ResultsType=0&fc=&fl=&fcf=&afc=&afl=&afcf=&TotalContentPages=NaN";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const html = res.results;

  const soup = new JSSoup(html);

  const elements = soup.findAll("li", {
    class: "search-results-item",
  });

  const jobs = [];

  for (const job of elements) {
    const job_title = job.find("div", {
      class: "search-results-item__content",
    }).find("a").text;
    const job_link =
      "https://careers.ing.com" + job.find("a").attrs.href;
    const city = translate_city(job.find("span", {
      class: "job-location",
    }).text.split(",")[0]);
    
    const { city: c, county: co } = await _counties.getCounties(city);

    const job_element = generateJob(
      job_title,
      job_link,
      "Romania",
      c,
      co
    );

    jobs.push(job_element);
  }
  console.log(jobs);
  return jobs;
};

const run = async () => {
  const company = "ING";
  const logo =
    "https://www.ing.jobs/static/ingdotcombasepresentation/static/img/logos/logo.hd.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
