"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://careers.loreal.com/en_US/jobs/SearchJobsAJAX/?3_110_3=18058";

const company = { company: "Loreal" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((response) => {
    const jobs = response.findAll("div", { class: "article__header__text" });

    jobs.forEach((job) => {
      const job_title = job.find("a").text.trim();
      const job_link = job.find("a").attrs.href;
      const city = job
        .find("div", { class: "article__header__text__subtitle" })
        .findAll("span")[0]
        .text.trim()
        .split(" ")[0];

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

    let logo =
      "https://logos-world.net/wp-content/uploads/2020/04/LOreal-Logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
