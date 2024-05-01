"use strict";
const scraper = require("../peviitor_scraper.js");

const url = "https://www.p-a.ro/cariere/";

const company = { company: "PoppAsociatii" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("div", { class: "post-wrap" });

    jobs.forEach((job) => {
      const job_title = job.find("a").text.trim();
      const job_link = job.find("a").attrs.href;

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: "Bucuresti",
        county: "Bucuresti",
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://www.p-a.ro/wp-content/themes/pa/images/logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
