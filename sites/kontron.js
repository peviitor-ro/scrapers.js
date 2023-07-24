"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.kontron.ro/Jobs.ro.html";

const company = { company: "kontron" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup
      .find("ul", { class: "filtered-item-list__items" })
      .findAll("li");
    console.log(jobs.length);
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job
        .find("div", { class: "filtered-item-list__items__item__title" })
        .find("a")
        .text.trim();
      const job_link =
        "https://www.kontron.ro" +
        job
          .find("div", { class: "filtered-item-list__items__item__title" })
          .find("a").attrs.href;
      const city = job
        .find("div", { class: "filtered-item-list__items__item__location" })
        .find("a")
        .text.trim();
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
    scraper.postApiPeViitor(finalJobs, company, process.env.Marcel);

    let logo = "https://www.kontron.ro/kontron_Logo-RGB-2C.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
