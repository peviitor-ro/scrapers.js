"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://careers.hilti.group/ro/locuri-de-munca/?search=&country=20000441&pagesize=100#results";

const company = { company: "Hilti" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((response) => {
    const jobs = response.findAll("div", { class: "card-job" });

    jobs.forEach((job) => {
      const job_title = job.find("a").text.trim();
      const job_link = "https://careers.hilti.group" + job.find("a").attrs.href;
      let city = job
        .find("li", { class: "list-inline-item" })
        .text.split(",")[0]
        .trim();
        
      if (city === "Bucuresti Ilfov"){
        city = "Bucuresti";
      }

      const { foudedTown, county } = getTownAndCounty(
        translate_city(city.toLowerCase())
      );

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: foudedTown,
        county: county,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://careers.hilti.group/images/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });