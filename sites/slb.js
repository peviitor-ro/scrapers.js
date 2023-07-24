"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://careers.slb.com/job-listing";

const company = { company: "SLB" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((response) => {
    let jobs = [];

    try {
      jobs = response
        .find("table", { id: "jobsTable" })
        .find("tbody")
        .findAll("tr");
    } catch (error) {
      console.log({ succes: "no jobs found" });
    }

    jobs.forEach((job) => {
      const country = job.findAll("td")[3].text.trim();

      if (country == "Romania") {
        const id = uuid.v4();
        const job_title = job.find("a").text.trim();
        let link = job.find("a").attrs.href;
        let job_link = "";

        if (link.includes("https")) {
          job_link = link.replace(/;/g, "&");
        } else {
          job_link = "https://careers.slb.com" + job.find("a").attrs.href;
        }

        const city = job.findAll("td")[2].text.trim();

        finalJobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          city: city,
          country: country,
          company: company.company,
        });
      }
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://www.slb.com/-/media/images/logo/slb_logo_rgb_svg.ashx";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });