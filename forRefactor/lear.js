"use strict";
const scraper = require("../peviitor_scraper.js");
const { Scraper } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const locations = res.findAll("span", { class: "jobGeoLocation" });
  const cities = [];
  const counties = [];

  for (let city of locations) {
    const city_name = city.text.split(",")[0].trim();
    const { foudedTown, county } = getTownAndCounty(
      translate_city(city_name.toLowerCase())
    );

    if (foudedTown && !cities.includes(foudedTown)) {
      cities.push(foudedTown);
      counties.push(county);
    }
  }

  return { cities: cities, counties: counties };
};

const url =
  "https://jobs.lear.com/search/?createNewAlert=false&q=&locationsearch=Romania";

const company = { company: "Lear" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then(async (soup) => {
    const jobs = soup
      .find("table", { id: "searchresults" })
      .find("tbody")
      .findAll("tr");

    await Promise.all(
      jobs.map(async (job) => {
        const job_title = job.find("a").text.trim();
        const job_link = "https://jobs.lear.com" + job.find("a").attrs.href;
        const city = job
          .find("span", { class: "jobLocation" })
          .text.split(",")[0]
          .trim();

        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.toLowerCase())
        );

        if (foudedTown && county) {
          finalJobs.push({
            job_title: job_title,
            job_link: job_link,
            company: company.company,
            city: foudedTown,
            county: county,
            country: "Romania",
          });
        } else {
          const { cities, counties } = await getAditionalCity(job_link);

          finalJobs.push({
            job_title: job_title,
            job_link: job_link,
            company: company.company,
            city: cities,
            county: counties,
            country: "Romania",
          });
        }
      })
    );
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
    let logo =
      "https://assets-global.website-files.com/6019e43dcfad3c059841794a/6019e43dcfad3cda2341797d_lear%20original%20logo.svg";
    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
