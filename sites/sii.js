"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.siiromania.ro/jobopportunities/#section";

const company = { company: "SII" };
let finalJobs = [];
const apiKey = process.env.KNOX
const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll('td', {class: 'title'});
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find('a').text.trim();
      const job_link = job.find('a').attrs.href;
      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        country: "Romania",
        city:"Bucuresti",
        company: company.company,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company, apiKey);

    let logo =
      "https://www.siiromania.ro/wp-content/themes/corporate-sii-romania/img/logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
