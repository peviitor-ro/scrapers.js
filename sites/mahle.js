"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://careers.mahle.com/search/?searchby=location&createNewAlert=false&optionsFacetsDD_country=RO";

const company = { company: "Mahle" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  const totaljobs = parseInt(
    soup.find("span", { class: "paginationLabel" }).findAll("b")[1].text.trim()
  );
  const range = scraper.range(0, totaljobs, 20);

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      range.forEach((num) => {
        let url = `https://careers.mahle.com/search/?searchby=location&createNewAlert=false&optionsFacetsDD_country=RO&startrow=${num}`;
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
              "https://careers.mahle.com" + job.find("a").attrs.href;
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

            if (finalJobs.length == totaljobs) {
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
      "https://rmkcdn.successfactors.com/5c90da23/c09e38db-cfd8-45b6-9300-8.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});