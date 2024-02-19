"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url = "https://jobs.continental.com/en/api/result-list/pagetype-jobs/";

const s = new scraper.ApiScraper(url);

let data = {
  "tx_conjobs_api[filter][locationSuggestChecksums][]":
    "97df691231f6e638f96c63c52454e425",
  "tx_conjobs_api[itemsPerPage]": 200,
  "tx_conjobs_api[currentPage]": 1,
};

s.headers.headers["Content-Type"] = "application/x-www-form-urlencoded";

let totalPages;

s.post(data)
  .then((d, err) => {
    totalPages = d.result.pagination.pagesCount;
  })
  .then(() => {
    let finalJobs = [];
    const company = { company: "Continental" };

    let jobs = [];

    let fetchData = () => {
      return new Promise((resolve) => {
        for (let i = 1; i <= totalPages; i++) {
          data["tx_conjobs_api[currentPage]"] = i;
          s.post(data).then((d) => {
            let response = d.result.list;
            response.forEach((element) => {
              jobs.push(element);
            });
            if (jobs.length === d.result.numFound) {
              resolve(jobs);
            }
          });
        }
      });
    };

    fetchData().then((jobs) => {
      jobs.forEach((job) => {
        const job_title = job.title;
        const job_link = job.absoluteUrl;
        const city = job.cityLabel;
        const country = job.countryLabel;

        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.trim().toLowerCase())
        );

        finalJobs.push({
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: foudedTown,
          county: county,
          country: country,
        });
      });

      console.log(JSON.stringify(finalJobs, null, 2));
      scraper.postApiPeViitor(finalJobs, company);

      let logo =
        "https://cdn.continental.com/fileadmin/_processed_/3/b/csm_continental_20logo-1920x1080_247d99d89e.png";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
  });
