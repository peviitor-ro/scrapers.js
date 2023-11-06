"use strict";
const { ApiScraper } = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url = "https://jobs.b-ite.com/api/v1/postings/search";

const company = { company: "Zollner" };
let finalJobs = [];

const data = {
  key: "46931c94b35f1165cae2df35cf4574a747be844e",
  channel: 0,
  locale: "ro",
  sort: { by: "title", order: "asc" },
  origin: "https://www.zollner.ro/ro/cariera/posturi-disponibile",
  page: { num: 1000, offset: 0 },
};

const s = new ApiScraper(url);

s.post(data)
  .then((data) => {
    const jobs = data.jobPostings;

    jobs.forEach((job) => {
      const job_title = job.title;
      const job_link = job.url;
      const { foudedTown, county } = getTownAndCounty(
        translate_city(job.jobSite.toLowerCase())
      );

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: foudedTown,
        county: county,
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://www.zollner.ro/fileadmin/user_upload/00_Startseite/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
