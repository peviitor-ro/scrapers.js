"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

let url =
  "https://node.bolt.eu/careers-portal/careersPortal/v3/getJobs/?version=CP.4.07";

const company = { company: "Bolt" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["User-Agent"] = "Mozilla/5.0";

s.get()
  .then((response) => {
    const jobs = response.data.jobs;

    jobs.forEach((job) => {
      const locations = job.locations;
      locations.forEach((location) => {
        if (location.country == "Romania") {
          const job_title = job.title;
          const job_link = "https://bolt.eu/en/careers/positions/" + job.id;
          const city = translate_city(location.city);
          const { county } = getTownAndCounty(city);

          finalJobs.push({
            job_title: job_title,
            job_link: job_link,
            company: company.company,
            country: "Romania",
            city: city,
            county: county,
          });
        }
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://bolt.eu/bolt-logo-original-on-white.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
