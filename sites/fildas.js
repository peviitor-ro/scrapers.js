"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.fildas.ro/cariere/";

const company = { company: "fildas" };
let finalJobs = [];
const SUFFIX = "#:~:text=";
const apiKey = process.env.KNOX
const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("h2");
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.text.trim().split("&#8211;")[0];
      const job_link = url + SUFFIX + job_title;
      const city = job.text.trim().split("&#8211;")[1]
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
    scraper.postApiPeViitor(finalJobs, company, apiKey);

    let logo =
      "https://www.fildas.ro/wp-content/uploads/2023/02/logo-Fildas-894x205.jpg?x32301";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
