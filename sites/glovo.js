"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url = "https://boards-api.greenhouse.io/v1/boards/glovo/jobs";

const company = { company: "Glovo" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((response) => {
    const jobs = response.jobs;

    jobs.forEach((job) => {
      const country = job.location.name;
      if (country.includes("Romania")) {
        const job_title = job.title;
        const job_link = job.absolute_url;
        const city = translate_city(job.location.name.split(",")[0]);
        const { foudedTown, county } = getTownAndCounty(city);

        finalJobs.push({
          job_title: job_title,
          job_link: job_link,
          city: foudedTown,
          county: county,
          country: "Romania",
          company: company.company,
        });
      }
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/317px-Glovo_logo.svg.png?20220725155704";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
