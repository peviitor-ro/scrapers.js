"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://careers.finastra.com/api/jobs?location=Romania&woe=12&stretchUnit=MILES&stretch=100&sortBy=relevance&descending=false&internal=false";

const company = { company: "Finastra" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get().then((response) => {
  const jobsNumber = response.totalCount;
  const pages = scraper.range(0, jobsNumber, 10);

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 1; i <= pages.length; i++) {
        let url = `https://careers.finastra.com/api/jobs?location=Romania&woe=12&stretchUnit=MILES&stretch=100&page=${i}&sortBy=relevance&descending=false&internal=false`;

        const s = new scraper.ApiScraper(url);

        s.get().then((response) => {
          let jobs = response.jobs;

          jobs.forEach((job) => {
            const id = uuid.v4();
            const job_title = job.data.title;
            const job_link = `https://careers.finastra.com/jobs/${job.data.slug}?lang=en-us`;
            const city = job.data.city;

            finalJobs.push({
              id: id,
              job_title: job_title,
              job_link: job_link,
              company: company.company,
              city: city,
              country: "Romania",
            });
          });

          if (finalJobs.length === jobsNumber) {
            resolve(finalJobs);
          }
        });
      }
    });
  };

  fetchData().then((finalJobs) => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://logowik.com/content/uploads/images/finastra2515.logowik.com.webp";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});