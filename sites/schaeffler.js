"use strict";
const scraper = require("../peviitor_scraper.js");
const { translate_city } = require("../utils.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");

async function get_aditonal_city(url) {
  const s = new scraper.Scraper(url);
  const soup = await s.soup;
  let locations = soup
    .findAll("span", { class: "jobGeoLocation" })
    .map((span) => span.text.split(",")[0].trim());

  let cities = [];
  let counties = [];

  locations.forEach((location) => {
    const city = translate_city(location.trim());

    const { foudedTown, county } = getTownAndCounty(city);

    if (foudedTown && county) {
      cities.push(foudedTown);
      counties.push(county);
    }
  });

  return { foundedTown: cities, county: counties };
}

const url =
  "https://jobs.schaeffler.com/search/?createNewAlert=false&q=&locationsearch=Romania&optionsFacetsDD_country=&optionsFacetsDD_customfield1=&optionsFacetsDD_shifttype=&optionsFacetsDD_lang=&optionsFacetsDD_customfield2=&optionsFacetsDD_customfield4=";

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  let jobs = [];
  const company = { company: "Schaeffler" };

  let pattern = /jobRecordsFound: parseInt\("(.*)"\)/g;

  const totalJobs = parseInt(soup.text.match(pattern)[0].split('"')[1]);
  const steps = scraper.range(0, totalJobs, 100);

  let fetchData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < steps.length; i++) {
        let url = `https://jobs.schaeffler.com/tile-search-results/?q=&locationsearch=Romania&startrow=${steps[i]}&_=1682543695317`;
        const s = new scraper.Scraper(url);

        s.soup.then((soup) => {
          let results = soup.findAll("li", { class: "job-tile" });

          const jobs_elements = results.map(async (job) => {
            const job_title = job.find("a").text.trim();
            const job_link =
              "https://jobs.schaeffler.com" + job.find("a").attrs.href;
            const city = translate_city(
              job.find("div", { class: "city" }).find("div").text.trim()
            );

            let location_obj = getTownAndCounty(city);

            if (!location_obj.county) {
              location_obj = await get_aditonal_city(job_link);
            }

            jobs.push({
              job_title: job_title,
              job_link: job_link,
              company: company.company,
              country: "Romania",
              city: location_obj.foudedTown,
              county: location_obj.county,
            });
          });

          Promise.all(jobs_elements).then(() => {
            if (jobs.length === totalJobs) {
              resolve(jobs);
            }
          });
        });
      }
    });
  };

  fetchData().then((jobs) => {
    console.log(JSON.stringify(jobs, null, 2));
    scraper.postApiPeViitor(jobs, company);
  });
});
