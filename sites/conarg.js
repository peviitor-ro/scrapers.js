"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "http://www.conarg.co/ro/cariere/oportunitati-de-cariera.html";

const company = { company: "Conarg" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("article", { class: "wk-content" }).findAll("li");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("h2").text.trim();
      const job_link = "http://www.conarg.co" + job.find("a").attrs.href;

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

    let logo = "http://www.conarg.co/images/logo/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });