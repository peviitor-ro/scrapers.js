"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://eaton.eightfold.ai/api/apply/v2/jobs?start=10&num=29&location=romania";

const s = new scraper.ApiScraper(url);

const company = { company: "Eaton" };
let finalJobs = [];

s.get().then((response) => {
  const pages = scraper.range(0, response.count, 10);
  let jobs = [];
  let totalJobs = response.count;

  const fetchPages = () => {
    return new Promise((resolve) => {
      pages.forEach((page) => {
        s.url = `https://eaton.eightfold.ai/api/apply/v2/jobs?start=${page}&num=${
          page + 10
        }&location=romania`;
        s.get().then((response) => {
          let jobspage = response.positions;
          jobspage.forEach((job) => {
            jobs.push(job);
          });
          if (jobs.length == totalJobs) {
            resolve(jobs);
          }
        });
      });
    });
  };

  fetchPages()
    .then((jobs) => {
      jobs.forEach((job) => {
        const id = uuid.v4();
        const job_title = job.name;
        const job_link = job.canonicalPositionUrl;
        let city;
        let locations = job.locations;
        locations.forEach((location) => {
          if (location.includes("Romania") || location.includes("ROU")) {
            try {
              city = location.split(",")[0];
            } catch (error) {
              city = location;
            }
          }
        });

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
        "https://assets.jibecdn.com/prod/eaton/0.2.148/assets/logo.png";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});
