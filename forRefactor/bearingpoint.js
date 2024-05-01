"use strict";
const scraper = require("../peviitor_scraper.js");
const { translate_city, get_jobtype } = require("../utils.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const url = "https://bearingpoint-romania.hirehive.com";

const company = { company: "BearingPoint" };
let finalJobs = [];

const s = new scraper.Scraper(url);

const acurate_city = {
  Iasi: {
    city: "Iasi",
    county: "Iasi",
  },
};

s.soup
  .then((soup) => {
    const jobs = soup.find("div", { class: "hh-jobs-openings" }).findAll("a");

    jobs.forEach((job) => {
      const job_title = job.find("h3").text.trim();
      const job_link =
        "https://bearingpoint-romania.hirehive.com" + job.attrs.href;
      const locations = job
        .find("div", { class: "hh-job-row-location" })
        .text.replace("and", ",");

      const default_cities = ["Bucuresti", "Sibiu", "Timisoara", "Iasi"];
      const default_counties = ["Bucuresti", "Sibiu", "Timis", "Iasi"];
      const cities = [];
      const counties = [];
      const remote = [get_jobtype(locations.toLowerCase().trim())];

      if (
        locations.split(",")[0].trim() == "Romania" ||
        locations.split(",")[0].trim() == "Hybrid"
      ) {
        default_cities.forEach((city) => cities.push(city));
        default_counties.forEach((county) => counties.push(county));
      } else {
        locations.split(",").forEach((location) => {
          const city = translate_city(location.trim());
          if (acurate_city[city]) {
            cities.push(acurate_city[city].city);
            counties.push(acurate_city[city].county);
          } else {
            const { foudedTown, county } = getTownAndCounty(city);

            if (foudedTown && county) {
              cities.push(foudedTown);
              counties.push(county);
            }
          }
        });
      }

      finalJobs.push({
        job_title: job_title,
        job_link: job_link,
        city: cities,
        county: counties,
        remote: remote,
        country: "Romania",
        company: company.company,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/BearingPoint_201x_logo.svg/800px-BearingPoint_201x_logo.svg.png?20161218212116";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
