"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://careers.ryanair.com/wp-content/uploads/ryr-workable/jobs.json";

const company = { company: "Ryanair" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((response) => {
    const jobs = response;

    jobs.forEach((job) => {
      const country = job.location.country;
      if (country == "Romania") {
        const id = uuid.v4();
        const job_title = job.title;
        const job_link = job.url;
        const city = job.city;

        finalJobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          city: city,
          country: country,
          company: company.company,
        });
      }
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://1000logos.net/wp-content/uploads/2020/03/Ryanair-Logo-500x313.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });