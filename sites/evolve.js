"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://recrutare.evolvetoday.ro/jobs";

const company = { company: "evolve" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("li", { class: "z-career-job-card-image" });

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job
        .find("span", { class: "text-block-base-link" })
        .text.trim();
      const job_link = job.find("a").attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        country: "Romania",
        city: "Romania",
        company: company.company,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://evolvetoday.ro/wp-content/uploads/2019/09/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
