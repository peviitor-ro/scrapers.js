"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://www.henkel.ro/ajax/collection/ro/1338824-1338824/queryresults/asJson";

const company = { company: "Henkel" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

s.get()
  .then((response) => {
    const jobs = response.results;

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.title;
      const job_link = "https://www.henkel.ro" + job.link;
      let city;

      try {
        city = job.location.split(",")[1].trim();
      } catch (e) {
        city = "Romania";
      }

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
      "https://www.henkel.ro/resource/blob/737324/1129f40d0df611e51758a0d35e6cab78/data/henkel-logo-standalone-svg.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });