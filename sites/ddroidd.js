"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://api.storyblok.com/v2/cdn/stories/?version=published&starts_with=vacancies%2F&&&excluding_ids=-1&token=4pOFw3LnvRlerPVVh0AB1Qtt&cv=undefined";

const company = { company: "DDroidd" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((response) => {
    const jobs = response.stories;

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.name;
      const job_link = "https://www.ddroidd.com/" + job.full_slug;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: "Romania",
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
  });