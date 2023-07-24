"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url = " https://careers.altenromania.ro/jds/1";

const company = { company: "Alten" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get().then((response) => {
  let pages = JSON.parse(response.success.message).pager.pageCount;
  let totalJobs = JSON.parse(response.success.message).pager.recordCount;

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 1; i <= pages; i++) {
        let url = " https://careers.altenromania.ro/jds/" + i;
        let s = new scraper.ApiScraper(url);
        s.get().then((response) => {
          const jobs = JSON.parse(response.success.message).recordList;

          jobs.forEach((job) => {
            const id = uuid.v4();
            const job_title = job.titlu;
            const job_link = "https://careers.altenromania.ro/job/" + job.id;
            const city = job.locatie;

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
      "https://careers.altenromania.ro/assets/img/svgs/logo.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});