"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://bearingpoint-romania.hirehive.com";

const company = { company: "BearingPoint" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { class: "hh-jobs-openings" }).findAll("a");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("h3").text.trim();
      const job_link =
        "https://bearingpoint-romania.hirehive.com" + job.attrs.href;
      const city = "Romania";

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        city: city,
        country: "Romania",
        company: company.company,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/BearingPoint_201x_logo.svg/800px-BearingPoint_201x_logo.svg.png?20161218212116"

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
