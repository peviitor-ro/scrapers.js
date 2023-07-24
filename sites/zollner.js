"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.zollner.ro/ro/cariera/posturi-disponibile";

const company = { company: "Zollner" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { id: "c4173" }).findAll("li");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("a").text.trim();
      const job_link = "https://www.zollner.ro" + job.find("a").attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: "Romania",
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://www.zollner.ro/fileadmin/templatefiles/images/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });