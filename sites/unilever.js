"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://careers.unilever.com/search-jobs/results?ActiveFacetID=798549&RecordsPerPage=1000&Distance=50&RadiusUnitType=0&Location=Romania&ShowRadius=False&IsPagination=False&FacetType=0&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=15&FacetFilters%5B0%5D.Display=Romania&FacetFilters%5B0%5D.IsApplied=true&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=1&OrganizationIds=34155&ResultsType=0";

const s = new scraper.ApiScraper(url);
s.headers.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

const company = { company: "Unilever" };
let finalJobs = [];

s.get()
  .then((response) => {
    const jobsData = response.results;

    const jobs = scraper
      .soup(jobsData)
      .find("ul", { class: "global-job-list--white" })
      .findAll("li");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("a").findAll("span")[0].text.trim();
      const job_link =
        "https://careers.unilever.com" + job.find("a").attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: "Romania",
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://1000logos.net/wp-content/uploads/2017/06/Unilever-Logo-500x379.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });