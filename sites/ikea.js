"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://ro-jobs.about.ikea.com/search-jobs/results?CurrentPage=1&RecordsPerPage=100&ShowRadius=False&IsPagination=False&FacetType=0&FacetFilters%5B0%5D.ID=798549&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=16&FacetFilters%5B0%5D.Display=Rom%C3%A2nia&FacetFilters%5B0%5D.IsApplied=true&SearchResultsModuleName=Search+Results+-+REFRESH&SearchFiltersModuleName=Search+Filters+-+REFRESH&SortCriteria=0&SortDirection=0&SearchType=5&ResultsType=0";

const company = { company: "IKEA" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

s.get()
  .then((response) => {
    const jobs = scraper
      .soup(response.results)
      .findAll("li", { class: "search-results-tile-item" });

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job
        .find("h3", { class: "tile-item-title" })
        .text.trim();
      const job_link =
        "https://ro-jobs.about.ikea.com" + job.find("a").attrs.href;
      const city = job
        .find("span", { class: "tile-job-location" })
        .text.split(",")[0]
        .trim();

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: city,
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://tbcdn.talentbrew.com/company/22908/img/logo/logo-10872-12036.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });