"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://kone.wd3.myworkdayjobs.com/wday/cxs/kone/Careers/jobs";

const company = { company: "Kone" };
let finalJobs = [];
const s = new scraper.ApiScraper(url);
let body = {
  appliedFacets: { Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
  limit: 20,
  offset: 0,
  searchText: "",
};
s.post(body)
  .then((response) => {
    var jobs = response.jobPostings;
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.title;
      const job_link =
        "https://kone.wd3.myworkdayjobs.com/en-US/Careers" + job.externalPath;
      let city = "Bucuresti";

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



    scraper.postApiPeViitor(finalJobs, company,process.env.Marcel);

    let logo = "https://kone.wd3.myworkdayjobs.com/Careers/assets/logo";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
