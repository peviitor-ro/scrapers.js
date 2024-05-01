"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://careers.coca-colahellenic.com/ro_RO/careers/SearchJobs/?1293=%5B6003%5D&1293_format=2880&listFilterMode=1&projectRecordsPerPage=50";

const company = { company: "CocaColaHBC" };
let finalJobs = [];
const regex = /\((.*?)\)/;
const apiKey = process.env.KNOX;
const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("div", { class: "article__header__text" });
    jobs.forEach((job) => {
      const job_title = job.find("a").text.trim();
      const job_link = job.find("a").attrs.href;
      const cityArray = job
        .find("span", { class: "list-item" })
        .text.trim()
        .match(regex);

      let city = "";
      let county = "";
      const remote = [];
      if (cityArray && cityArray.length >= 2) {
        const obj = getTownAndCounty(
          translate_city(cityArray[1]
            .replace("-", " ")
            .toLowerCase())
        );
        city = obj.foudedTown;
        county = obj.county;
      } else {
        remote.push("Remote");
      }

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: city,
        county: county,
        remote: remote,
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company, apiKey);

    let logo = "https://careers.coca-colahellenic.com/portal/5/images/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
