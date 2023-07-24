"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://michelinhr.wd3.myworkdayjobs.com/wday/cxs/michelinhr/Michelin/jobs";

const s = new scraper.ApiScraper(url);

s.headers.headers["Content-Type"] = "application/json";
s.headers.headers["Accept"] = "application/json";

let data = {
  appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
  limit: 20,
  offset: 0,
  searchText: "",
};
s.post(data).then((d, err) => {
  let step = 20;
  let totalJobs = d.total;

  const range = (start, stop, step) =>
    Array.from(
      { length: (stop - start) / step + 1 },
      (_, i) => start + i * step
    );

  let finalJobs = [];
  const company = { company: "Michelin" };

  let jobs = [];

  let steps = range(0, totalJobs, step);

  let fetchData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < steps.length; i++) {
        data["offset"] = steps[i];
        s.post(data).then((d) => {
          let response = d.jobPostings;
          response.forEach((element) => {
            jobs.push(element);
          });
          if (jobs.length === totalJobs) {
            resolve(jobs);
          }
        });
      }
    });
  };

  fetchData().then((jobs) => {
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.title;
      const job_link =
        "https://michelinhr.wd3.myworkdayjobs.com/ro-RO/Michelin" +
        job.externalPath;
      const city = job.locationsText;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: city,
        country: "Romania",
      });
    });
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
  });
});