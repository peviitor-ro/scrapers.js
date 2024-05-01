const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const Jssoup = require("jssoup").default;

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote: [],
});

const getJobs = async () => {
  let url =
    "https://careers.unilever.com/search-jobs/results?ActiveFacetID=798549&RecordsPerPage=1000&Distance=50&RadiusUnitType=0&Location=Romania&ShowRadius=False&IsPagination=False&FacetType=0&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=15&FacetFilters%5B0%5D.Display=Romania&FacetFilters%5B0%5D.IsApplied=true&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=1&OrganizationIds=34155&ResultsType=0";
  const jobs = [];
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const res = await scraper.get_soup("JSON");
  const html = res.results;
  const soup = new Jssoup(html);

  const items = soup
    .find("ul", { class: "global-job-list--white" })
    .findAll("li");

  items.forEach((item) => {
    const job_title = item.find("a").findAll("span")[0].text.trim();
    const job_link = "https://careers.unilever.com" + item.find("a").attrs.href;
    const { foudedTown, county } = getTownAndCounty(
      item.find("a").attrs.href.split("/")[2]
    );

    jobs.push(generateJob(job_title, job_link, foudedTown, county));
  });

  return jobs;
};

const getParams = () => {
  const company = "Unilever";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/06/Unilever-Logo-500x379.png";
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
