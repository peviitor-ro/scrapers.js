"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const getAditionalCity = async (url, excluded) => {
  const s = new scraper.Scraper(url);
  const soup = await s.get_soup();

  const location = soup
    .findAll("span", { class: "jobGeoLocation" })
    .map((location) => location.text.split(",")[0].trim());

  for (let city in location) {
    if (!excluded.includes(location[city].trim())) {
      const { foudedTown, county } = getTownAndCounty(
        translate_city(location[city].trim().toLowerCase())
      );

      if (foudedTown && county) {
        return { foudedTown: foudedTown, county: county };
      }
    }
  }
};

const url =
  "https://jobs.zf.com/search/?createNewAlert=false&q=&locationsearch=Romania&optionsFacetsDD_facility=&optionsFacetsDD_shifttype=&optionsFacetsDD_country=RO&optionsFacetsDD_customfield3=";

const company = { company: "ZF" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  let totalJobs = parseInt(
    soup.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  let pages = scraper.range(0, totalJobs, 25);

  const fetchData = () => {
    let jobs = [];
    return new Promise((resolve) => {
      pages.forEach((page) => {
        const s = new scraper.Scraper(url + "&startrow=" + page);

        s.soup.then((soup) => {
          const results = soup.find("tbody").findAll("tr");
          results.forEach((job) => {
            jobs.push(job);
          });
          if (jobs.length === totalJobs) {
            resolve(jobs);
          }
        });
      });
    });
  };

  fetchData()
    .then(async (jobs) => {
      await Promise.all(
        jobs.map(async (job) => {
          const job_title = job.find("a").text.trim();
          const job_link = "https://jobs.zf.com" + job.find("a").attrs.href;
          const city = job
            .find("span", { class: "jobLocation" })
            .text.split(",")[0]
            .trim();

          const { foudedTown, county } = getTownAndCounty(
            translate_city(city.trim().toLowerCase())
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
            const { foudedTown, county } = await getAditionalCity(job_link, [
              "Roma",
            ]);

            if (foudedTown && county) {
              finalJobs.push({
                job_title: job_title,
                job_link: job_link,
                company: company.company,
                city: foudedTown,
                county: county,
                country: "Romania",
              });
            }
          }
        })
      );
    })
    .then(() => {
      console.log(JSON.stringify(finalJobs, null, 2));

      scraper.postApiPeViitor(finalJobs, company);

      let logo =
        "https://upload.wikimedia.org/wikipedia/commons/3/3f/ZF_Official_Logo.svg";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});
