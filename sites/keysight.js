"use strict";
// TODO: paginations
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url = "https://jobs.keysight.com/go/Keysight-in-Romania/8005200/";

const company = { company: "Keysight" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((response) => {
    const jobs = response
      .find("table", { id: "searchresults" })
      .find("tbody")
      .findAll("tr");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("a").text.trim();
      const job_link = "https://jobs.keysight.com" + job.find("a").attrs.href;
      const city = job
        .find("span", { class: "jobLocation" })
        .text.split(",")[0]
        .trim();

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
      "https://rmkcdn.successfactors.com/b5c39f83/8331f5be-826f-4ccf-ae53-f.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
