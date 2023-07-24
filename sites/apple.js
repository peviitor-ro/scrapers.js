"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://jobs.apple.com/ro-ro/search?location=romania-ROMC";

const company = { company: "apple" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("table", { id: "tblResultSet" }).findAll("tbody");
    console.log(jobs.length);
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("a").text.trim();
      const job_link = "https://jobs.apple.com" + job.find("a").attrs.href;
      const city = job.find("td", { class: "table-col-2" }).text.trim();

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
    scraper.postApiPeViitor(finalJobs, company,process.env.Marcel);
    let logo = "https://www.apple.com/apple-touch-icon.png";
    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
