"use strict";
const scraper = require("../peviitor_scraper.js");
const { translate_city } = require("../utils.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");

let url =
  "https://careers.cbre.com/en_US/careers/SearchJobs/?9577=%5B17229%5D&9577_format=10224&listFilterMode=1&jobRecordsPerPage=100&";

const company = { company: "CBRE" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("article", { class: "article--result" });

    jobs.forEach((job) => {
      const job_title = job.find("a").text.trim();
      const job_link = job.find("a").attrs.href;
      const locations = job
        .find("div", { class: "article__header__text__subtitle" })
        .findAll("span")[2]
        .text.trim()
        .split("-");

      const cities = [];
      const countries = [];
      let remote = [];

      if (job_title.toLowerCase().includes("remote")) {
        remote.push("Remote");
      } else {
        locations.forEach((location) => {
          const city = translate_city(
            location.trim().replace("&#039;", "").trim()
          );
          const { foudedTown, county } = getTownAndCounty(city);

          if (
            foudedTown &&
            county &&
            !cities.includes(foudedTown) &&
            !countries.includes(county)
          ) {
            cities.push(foudedTown);
            countries.push(county);
          }
        });
      }

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: cities,
        county: countries,
        remote: remote
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
    let logo = "https://www.logo.wine/a/logo/CBRE_Group/CBRE_Group-Logo.wine.svg";
    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
