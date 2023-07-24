"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url = "https://www.smithfield.ro/ro/cariere/posturi-disponibile";

const company = { company: "Smithfield" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { class: "jobs" }).findAll("div");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("span", { class: "first" }).text.trim();
      const job_link = job.find("span", { class: "second" }).find("a")
        .attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://www.smithfield.ro/assets/app/images/logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });