const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");
const Jssoup = require("jssoup").default;

const additionalHeaders = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

const generateJob = (job_title, job_link, country, county, city) => ({
  job_title,
  job_link,
  country,
  county,
  city,
  remote: [],
});

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const res = await scraper.get_soup("HTML");
  const locations = res.find("span", { class: "job-location" }).text.split(";");
  return new Promise((resolve) => {
    locations.forEach((location) => {
      const { foudedTown, county } = getTownAndCounty(
        translate_city(location.trim().toLowerCase())
      );
      if (foudedTown && county) {
        resolve({ foudedTown, county });
      }
    });
  });
};

const getJobs = async () => {
  const url =
    "https://en.jobs.sanofi.com/search-jobs/results?ActiveFacetID=798549&CurrentPage=1&RecordsPerPage=100&Distance=50&RadiusUnitType=0&ShowRadius=False&IsPagination=False&FacetType=0&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=13&FacetFilters%5B0%5D.Display=Romania&FacetFilters%5B0%5D.IsApplied=true&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=5&ResultsType=0";
  const scraper = new Scraper(url);

  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const res = await scraper.get_soup("JSON");

  const jobs = [];

  const soup = new Jssoup(res.results);

  const jobsElements = soup.findAll("ul")[1].findAll("li");

  jobsElements.forEach(async (job) => {
    const job_title = job.find("h2").text.trim();
    const job_link = "https://en.jobs.sanofi.com" + job.find("a").attrs.href;
    const city = job
      .find("span", { class: "job-location" })
      .text.split(",")[0]
      .trim();

    const { foudedTown, county } = getTownAndCounty(
      translate_city(city.toLowerCase())
    );

    const isCounty = async () => {
      if (foudedTown && county) {
        return { foudedTown, county };
      } else {
        return await getAditionalCity(job_link);
      }
    };

    await isCounty().then((res) => {
      const { foudedTown, county } = res;
      jobs.push(
        generateJob(job_title, job_link, "Romania", county, foudedTown)
      );
    });
  });

  return jobs;
};

const getParams = () => {
  const company = "Sanofi";
  const logo =
    "https://www.sanofi.ro/dam/jcr:9f06f321-3c2b-485f-8a84-b6c33badc56a/logo-header-color-large.png";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs().then((res) => {
    return res;
  });

  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
