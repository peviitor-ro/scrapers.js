"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://philips.wd3.myworkdayjobs.com/wday/cxs/philips/jobs-and-careers/jobs";

const company = { company: "Philips" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["Content-Type"] = "application/json";
s.headers.headers["Accept"] = "application/json";

let data = {
  appliedFacets: { locationHierarchy1: ["6e1b2a934716103c2addacb847bf00cc"] },
  limit: 20,
  offset: 0,
  searchText: "",
};

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
          "https://philips.wd3.myworkdayjobs.com/en-US/jobs-and-careers" +
          job.externalPath;
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

      let logo =
        "https://1000logos.net/wp-content/uploads/2017/05/Phillips-Logo-500x281.png";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});