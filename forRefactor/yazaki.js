"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://careers.yazaki.com/search/?q=&locationsearch=Romania&startrow=0";

const company = { company: "Yazaki" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  let totalJobs = parseInt(
    soup.find("span", { class: "paginationLabel" }).findAll("b")[1].text.trim()
  );
  let step = 25;
  let numberPages = Math.ceil(totalJobs / step);

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      let jobs = [];

      for (let i = 0; i < numberPages; i++) {
        const url = `https://careers.yazaki.com/search/?q=&locationsearch=Romania&startrow=${i * step}`;
        const s = new scraper.Scraper(url);

        s.soup.then((soup) => {
          const results = soup.find("tbody").findAll("tr");
          results.forEach((job) => {
            jobs.push(job);
            if (jobs.length === totalJobs) {
              resolve(jobs);
            }
          });
        });
      };
    });
  };

  fetchData()
    .then((jobs) => {
      jobs.forEach((job) => {
        const location = job.find("span", { class: "jobLocation" }).text.trim();

        if (location.includes("RO") || location.includes("Romania")) {
          const id = uuid.v4();
          const job_title = job
            .find("a", { class: "jobTitle-link" })
            .text.trim();
          const job_link =
            "https://careers.yazaki.com" +
            job.find("a", { class: "jobTitle-link" }).attrs.href;
          const city = job.find("span", { class: "jobFacility" }).text.trim();

          finalJobs.push({
            id: id,
            job_title: job_title,
            job_link: job_link,
            company: company.company,
            city: city,
            country: "Romania",
          });
        }
      });
    })
    .then(() => {
      console.log(JSON.stringify(finalJobs, null, 2));
      console.log(finalJobs.length);

      scraper.postApiPeViitor(finalJobs, company);

      let logo =
        "https://rmkcdn.successfactors.com/6779db45/43c1c988-2201-4a2f-bbf4-a.png";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});