"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

let url =
  "https://careers.se.com/api/jobs?keywords=Romania&lang=en-US&page=1&sortBy=relevance&descending=false&internal=false";

const company = { company: "SchneiderElectric" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get().then((response) => {
  let totalJobs = response.languageCounts["en-us"].count;

  let pages = scraper.range(1, totalJobs, 10);

  const fetchData = () => {
    return new Promise((resolve) => {
      for (let i = 1; i <= pages.length; i++) {
        const url = `https://careers.se.com/api/jobs?keywords=Romania&lang=en-US&page=${i}&sortBy=relevance&descending=false&internal=false`;
        const s = new scraper.ApiScraper(url);

        s.get().then((response) => {
          const jobs = response.jobs;

          jobs.forEach((elem) => {
            const job = elem.data;

            const locations = job.full_location.split(";");
            const remote = job.multipleLocations ? "Remote" : [];

            locations.forEach((location) => {
              const city = location.split(",")[0];
              const { foudedTown, county } = getTownAndCounty(
                translate_city(city.toLowerCase().trim())
              );

              if (foudedTown) {
                finalJobs.push({
                  job_title: job.title,
                  job_link: job.meta_data.job_description_url,
                  company: company.company,
                  city: foudedTown,
                  county: county,
                  remote: remote,
                  country: "Romania",
                });
              } else if (city === "Romania") {
                finalJobs.push({
                  job_title: job.title,
                  job_link: job.meta_data.job_description_url,
                  company: company.company,
                  city: "Bucuresti",
                  county: "Bucuresti",
                  remote: remote,
                  country: "Romania",
                });
              }
            });

            if (finalJobs.length === totalJobs) {
              resolve(finalJobs);
            }
          });
        });
      }
    });
  };

  fetchData().then((jobs) => {
    console.log(JSON.stringify(jobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Schneider_Electric_2007.svg/284px-Schneider_Electric_2007.svg.png?20150906005100";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});
