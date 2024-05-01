"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url = "https://www.hill-international.com/en-RO/vacancies";

const s = new scraper.Scraper(url);
let finalljobs = [];
const company = { company: "HillInternational" };

s.soup
  .then((soup) => {
    let jobs = soup.find("ul", { class: "job-list" }).findAll("li");

    jobs.forEach((job) => {
      const job_title = job.find("h2").text.trim();
      const job_link =
        "https://www.hill-international.com/" + job.find("a").attrs.href;
      const location = job
        .find("div", { class: "field-location" })
        .text.split(",");
      const { foudedTown, county } = getTownAndCounty(
        translate_city(location[location.length - 1].trim().toLowerCase())
      );

      const country = "Romania";

      finalljobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: country,
        city: foudedTown,
        county: county,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalljobs, null, 2));
    scraper.postApiPeViitor(finalljobs, company);
    let logo =
      "https://www.iletisimofisi.com/wp-content/uploads/2019/01/hill-international-logo.jpg";
    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
