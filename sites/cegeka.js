"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url = "https://www.cegeka.com/en/ro/jobs/all-jobs?";

const company = { company: "Cegeka" };
let finalJobs = [];

const s = new scraper.Scraper(url);
const pattern = /let vacancies = \[{(.*)}\]/gm;

s.soup
  .then((soup) => {
    const jobsObject = soup.text.match(pattern);
    const jobs = JSON.parse(jobsObject[0].replace("let vacancies = ", ""));

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.header_data.vacancy_title;
      const job_link = job.slug;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://www.cegeka.com/hubfs/Cegeka%20Website%20-%202017/Logo/cegeka-logo-color.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });