"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url = "https://www.techtalent.ro/careers/";

const company = { company: "TechTalent" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("div", { class: "job-box-index-container" });

    jobs.forEach((job) => {
      const job_title = job.find("span", { class: "job-title" }).text.trim();
      const job_link = job.find("a").attrs.href;
      let city = job.find("span", { class: "job-city" }).text.trim();
      let county;
      let remote = [];

      if (city === "") {
        city = ["Bucuresti", "Timisoara", "Cluj-Napoca", "Brasov"];
        county = ["Bucuresti", "Timis", "Cluj", "Brasov"];
      } else if (city === "Cluj/Bucuresti/Brasov") {
        city = ["Cluj-Napoca", "Bucuresti", "Brasov"];
        county = ["Cluj", "Bucuresti", "Brasov"];
      } else if (city === "remote") {
        remote = ["Remote"];
        city = "";
      } else {
        const obj = getTownAndCounty(translate_city(city.toLowerCase()));
        city = obj.foudedTown;
        county = obj.county;
      }

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: city,
        conuty: county,
        remote: remote,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://www.techtalent.ro/wp-content/uploads/2021/02/logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
