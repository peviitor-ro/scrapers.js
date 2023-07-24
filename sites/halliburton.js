"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://jobs.halliburton.com/search/?createNewAlert=false&q=&locationsearch=Romania";

const company = { company: "Halliburton" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  let totalJobs = parseInt(
    soup.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  let pages = scraper.range(0, totalJobs, 25);

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      let jobs = [];
      pages.forEach((page) => {
        const url = `https://jobs.halliburton.com/search/?createNewAlert=false&q=&locationsearch=Romania&startrow=${page}`;
        const s = new scraper.Scraper(url);

        s.soup.then((soup) => {
          const results = soup.find("tbody").findAll("tr");
          results.forEach((job) => {
            jobs.push(job);
          });
          if (jobs.length === totalJobs) {
            resolve(jobs);
          }
        });
      });
    });
  };

  fetchData()
    .then((jobs) => {
      jobs.forEach((job) => {
        const id = uuid.v4();
        const job_title = job.find("a").text.trim();
        const job_link =
          "https://jobs.halliburton.com" + job.find("a").attrs.href;
        const city = job
          .find("span", { class: "jobLocation" })
          .text.split(",")[0]
          .trim();

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
        "https://rmkcdn.successfactors.com/6fdd2711/8ba9d1d9-30b6-4c01-b093-b.svg";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});
