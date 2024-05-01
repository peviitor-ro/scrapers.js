"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://careers.sagittarius.agency/jobs?location=Romania";

const company = { company: "Sagittarius" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { id: "jobs" }).findAll("li");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job
        .find("span", { class: "text-block-base-link" })
        .text.trim();
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
      "https://images.teamtailor-cdn.com/images/s3/teamtailor-production/logotype-v3/image_uploads/0bc756dc-2208-4bc4-a165-43028568414b/original.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });