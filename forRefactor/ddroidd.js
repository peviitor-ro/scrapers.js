"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://api.storyblok.com/v2/cdn/stories/?version=published&starts_with=vacancies%2F&&&excluding_ids=-1&token=4pOFw3LnvRlerPVVh0AB1Qtt&cv=undefined";

const company = { company: "DDroidd" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((response) => {
    const jobs = response.stories;

    jobs.forEach((job) => {
      const job_title = job.name;
      const job_link = "https://www.ddroidd.com/" + job.full_slug;
      const remote = job.content.type.toLowerCase().includes("remote")
        ? ["Remote"]
        : [];
      let city = "";
      let county = "";

      const obj = getTownAndCounty(
        translate_city(job.content.location.toLowerCase())
      );

      if (obj.foudedTown && obj.county) {
        city = obj.foudedTown;
        county = obj.county;
      }

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: city,
        county: county,
        country: "Romania",
        remote: remote,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
  });
