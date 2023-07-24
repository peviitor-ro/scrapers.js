"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://nxp.wd3.myworkdayjobs.com/wday/cxs/nxp/careers/jobs";

const company = { company: "NPX" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["Content-Type"] = "application/json";
s.headers.headers["Accept"] = "application/json";

let data = { appliedFacets: {}, limit: 20, offset: 0, searchText: "Romania" };

s.post(data).then((response) => {
  let step = 20;
  let totalJobs = response.total;

  const range = scraper.range(0, totalJobs, step);

  const fetchData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < range.length; i++) {
        data["offset"] = range[i];
        s.post(data).then((response) => {
          let jobs = response.jobPostings;
          jobs.forEach((job) => {
            finalJobs.push(job);
          });
          if (finalJobs.length === totalJobs) {
            resolve(finalJobs);
          }
        });
      }
    });
  };

  let jobs = [];

  fetchData()
    .then((finalJobs) => {
      finalJobs.forEach((job) => {
        const id = uuid.v4();
        const job_title = job.title;
        const job_link =
          "https://nxp.wd3.myworkdayjobs.com/en-US/careers" + job.externalPath;
        const city = job.locationsText.split(",")[0];

        jobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          country: "Romania",
          city: city,
        });
      });
    })
    .then(() => {
      console.log(JSON.stringify(jobs, null, 2));

      scraper.postApiPeViitor(jobs, company);

      let logo = "https://nxp.wd3.myworkdayjobs.com/careers/assets/logo";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});