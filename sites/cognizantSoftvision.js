"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.cognizantsoftvision.com/job-search/?location=romania";

const s = new scraper.Scraper(url);

let finalJobs = [];
const company = { company: "CognizantSoftvision" };

s.soup
  .then((soup) => {
    const json = JSON.parse(
      soup.find("script", { type: "application/json" }).text
    );

    json.props.pageProps.jobOpenings.jobs.forEach((job) => {
      if (job.location == "Romania") {
        const id = uuid.v4();
        const job_title = job.title;
        const job_link = "https://www.cognizantsoftvision.com" + job.link;
        const city = job.location;

        finalJobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: city,
          country: "Romania",
        });
      }
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
  });