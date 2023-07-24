"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://agricover.ro/cariere";

const company = { company: "Agricover" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { class: "careers-list" }).findAll("div");

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("h3").find("span").text.trim();
      const job_link = "https://agricover.ro" + job.find("a").attrs.href;
      const city = job.find("h5").find("span").text.trim();

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
      "https://agricover.ro/Files/Images/AgricoverCorporate/logo/svg/logo-positive.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });