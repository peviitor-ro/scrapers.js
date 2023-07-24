"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://jobs.vitesco-technologies.com/ro/search/?q=&locationsearch=Romania";

const company = { company: "VitescoTechnologies" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  const totalJobs = parseInt(
    soup.find("span", { class: "paginationLabel" }).findAll("b")[1].text.trim()
  );
  const querys = scraper.range(0, totalJobs, 25);

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      querys.forEach((query) => {
        const url = `https://jobs.vitesco-technologies.com/ro/search/?q=&locationsearch=Romania&startrow=${query}`;
        const s = new scraper.Scraper(url);

        s.soup.then((soup) => {
          const jobs = soup
            .find("table", { id: "searchresults" })
            .find("tbody")
            .findAll("tr");

          jobs.forEach((job) => {
            const id = uuid.v4();
            const job_title = job.find("a").text.trim();
            const job_link =
              "https://jobs.vitesco-technologies.com" +
              job.find("a").attrs.href;
            const city = job
              .find("span", { class: "jobLocation" })
              .text.split(",")[0]
              .trim();

            finalJobs.push({
              id: id,
              job_title: job_title,
              job_link: job_link,
              country: "Romania",
              city: city,
              company: company.company,
            });

            if (finalJobs.length === totalJobs) {
              resolve(finalJobs);
            }
          });
        });
      });
    });
  };

  fetchData().then((finalJobs) => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://rmkcdn.successfactors.com/c3583d3f/1a27f760-8f11-480e-b76b-f.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});