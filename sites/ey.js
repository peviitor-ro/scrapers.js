"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://careers.ey.com/ey/search/?q=Romania&startrow=0";

const s = new scraper.Scraper(url);

s.soup.then((response) => {
  const totalJobs = parseInt(
    response.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  const step = 25;

  const range = scraper.range(0, totalJobs, step);

  const company = { company: "EY" };
  let finalJobs = [];

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < range.length; i++) {
        let url =
          "https://careers.ey.com/ey/search/?q=Romania&startrow=" + range[i];
        const s = new scraper.Scraper(url);
        s.soup.then((response) => {
          let jobs = response
            .find("table", { class: "searchResults" })
            .find("tbody")
            .findAll("tr");
          jobs.forEach((job) => {
            const id = uuid.v4();
            const job_title = job.find("a").text;
            const job_link =
              "https://careers.ey.com" + job.find("a").attrs.href;
            const city = job
              .find("span", { class: "jobLocation" })
              .text.split(",")[0]
              .trim();

            finalJobs.push({
              id: id,
              job_title: job_title,
              job_link: job_link,
              company: company.company,
              country: "Romania",
              city: city,
            });
          });
          if (finalJobs.length === totalJobs) {
            resolve(finalJobs);
          }
        });
      }
    });
  };

  fetchData().then((finalJobs) => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://rmkcdn.successfactors.com/bcfdbc8a/688bb7d2-e818-494b-967e-0.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});