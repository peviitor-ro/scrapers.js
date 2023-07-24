"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url =
  "https://careers.cbre.com/en_US/careers/SearchJobs/?9577=%5B17229%5D&9577_format=10224&listFilterMode=1&jobRecordsPerPage=100&";

const company = { company: "CBRE" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("article", { class: "article--result" });

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("a").text.trim();
      const job_link = job.find("a").attrs.href;
      const city = job
        .find("div", { class: "article__header__text__subtitle" })
        .findAll("span")[2]
        .text.split("-")[0]
        .trim();

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: city,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://www.logo.wine/a/logo/CBRE_Group/CBRE_Group-Logo.wine.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
