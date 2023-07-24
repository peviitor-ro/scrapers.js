"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://jobs.lear.com/search/?createNewAlert=false&q=&locationsearch=Romania";

const company = { company: "Lear" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup
      .find("table", { id: "searchresults" })
      .find("tbody")
      .findAll("tr");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("a").text.trim();
      const job_link = "https://jobs.lear.com" + job.find("a").attrs.href;
      const city = job
        .find("span", { class: "jobLocation" })
        .text.split(",")[0]
        .trim();

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
      "https://assets-global.website-files.com/6019e43dcfad3c059841794a/6019e43dcfad3cda2341797d_lear%20original%20logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });