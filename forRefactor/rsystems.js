"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://eu.rsystems.com/category/careers/romania-bucharest/";

const company = { company: "RSystems" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("div", { class: "uael-post__inner-wrap" });

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("h3").text.trim();
      const job_link = job.find("a").attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        city: "Romania",
        country: "Romania",
        company: company.company,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://eu.rsystems.com/wp-content/uploads/2021/01/R-Systems-EUROPE-Blue-new.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });