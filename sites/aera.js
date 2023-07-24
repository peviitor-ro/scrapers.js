"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.aeratechnology.com/careers";

const s = new scraper.Scraper(url);

let finalJobs = [];
const company = { company: "Aera" };

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { id: "open-roles" }).findAll("li");

    for (let job of jobs) {
      const country = job
        .find("p", { class: "_1RSuWi9-4R" })
        .text.split(",")
        [
          job.find("p", { class: "_1RSuWi9-4R" }).text.split(",").length - 1
        ].trim();

      if (country == "Romania") {
        const id = uuid.v4();
        const job_title = job.find("h3").text.trim();
        const job_link = job.find("a").attrs.href;
        const city = job
          .find("p", { class: "_1RSuWi9-4R" })
          .text.split(",")[0]
          .trim();

        finalJobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: city,
          country: country,
        });
      }
    }
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
  });