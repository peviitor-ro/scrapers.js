"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

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
      const job_title = job.header_data.vacancy_title;
      const job_link = job.slug;

      const cities = [];
      const counties = [];

      const locations = JSON.parse(job.header_data.filter_location);

      if (locations.length === 0) {
        cities.push("All");
        counties.push("All");
      } else {
        locations.forEach((location) => {
          const { foudedTown, county } = getTownAndCounty(
            translate_city(location.city.toLowerCase().trim())
          );

          if (foudedTown && county) {
            cities.push(foudedTown);
            counties.push(county);
          }
        });
      }
      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: cities,
        county: counties,
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
