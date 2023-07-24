"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.distrigazsud-retele.ro/cariere/posturi-disponibile/";

const company = { company: "DistrigazSudRetele" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { class: "general-text" }).findAll("a");

    for (let i = 0; i < jobs.length - 2; i++) {
      const id = uuid.v4();
      const job_title = jobs[i].text;
      const job_link = jobs[i].attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: "Romania",
        country: "Romania",
      });
    }
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://www.distrigazsud-retele.ro/wp-content/themes/distrigaz/images/logo-footer.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });