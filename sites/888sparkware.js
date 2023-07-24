"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://888sparkware.ro";

const company = { company: "888sparkware" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("div", { class: "position-container" });

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job
        .find("div", { class: "position-title" })
        .text.trim();
      const job_link = job.find("a", { class: "position-link" }).attrs.href;
      const city = job.find("div", { class: "position-location" }).text.trim();

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        country: "Romania",
        city: city,
        company: company.company,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://888sparkware.ro/wp-content/uploads/2020/06/Sparkware_black_horizontal.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });