"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url = "https://www.revolut.com/careers/?city=Romania+-+Remote";

const company = { company: "Revolut" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobsObject = soup.find("script", { id: "__NEXT_DATA__" });

    const jobs = JSON.parse(jobsObject.text).props.pageProps.positions;

    jobs.forEach((job) => {
      job.locations.forEach((location) => {
        if (location.country === "Romania") {
          const id = uuid.v4();
          const job_title = job.text;
          const job_link = "https://www.revolut.com/careers/position/" + job.id;

          finalJobs.push({
            id: id,
            job_title: job_title,
            job_link: job_link,
            company: company.company,
            city: "Romania",
            country: "Romania",
          });
        }
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    const logo =
      "https://cdn.icon-icons.com/icons2/3914/PNG/512/revolut_logo_icon_248648.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });