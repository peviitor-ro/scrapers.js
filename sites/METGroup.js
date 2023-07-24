"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://api.smartrecruiters.com/v1/companies/metgroup/postings?limit=100&country=ro";

const company = { company: "METGroup" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((response) => {
    const jobs = response.content;

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.name;
      const job_link = "https://jobs.smartrecruiters.com/METGroup/" + job.id;
      const city = job.location.city;

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

    let logo = "https://group.met.com/media/3f4d1h1o/met-logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });