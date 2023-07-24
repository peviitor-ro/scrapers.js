"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  " https://flextronics.wd1.myworkdayjobs.com/wday/cxs/flextronics/Careers/jobs";

const s = new scraper.ApiScraper(url);
s.headers.headers["Content-Type"] = "application/json";
s.headers.headers["Accept"] = "application/json";

let data = {
  appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
  limit: 20,
  offset: 0,
  searchText: "",
};

s.post(data).then((response) => {
  let step = 20;
  let totalJobs = response.total;

  const range = scraper.range(0, totalJobs, step);

  const company = { company: "Flex" };
  let finalJobs = [];

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
          "https://flextronics.wd1.myworkdayjobs.com/ro-RO/Careers" +
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

      let logo = "https://flex.com/wp-content/themes/flex/images/logo.svg";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});