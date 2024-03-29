"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url = "https://www.aeratechnology.com/careers";

const s = new scraper.Scraper(url);

let finalJobs = [];
const company = { company: "Aera" };

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { id: "open-roles" }).findAll("li");

    for (let job of jobs) {
      const country = job
        .find("p", { class: "_1RSuWi9-4R" })
        .text.split(",")
        [
          job.find("p", { class: "_1RSuWi9-4R" }).text.split(",").length - 1
        ].trim();

      if (country == "Romania") {
        const job_title = job.find("h3").text.trim();
        const job_link = job.find("a").attrs.href;
        const city = job
          .find("p", { class: "_1RSuWi9-4R" })
          .text.split(",")[0]
          .trim();

        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.toLowerCase())
        );

        finalJobs.push({
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: foudedTown,
          county: county,
          country: country,
        });
      }
    }
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://lever-client-logos.s3.amazonaws.com/dfa07fbc-23b8-4677-9df5-6bb3d39f07db-1511999864878.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
