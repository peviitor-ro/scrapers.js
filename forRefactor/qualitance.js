"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const getAditionalCity = async (url) => {
  const s = new scraper.Scraper(url);
  const soup = await s.get_soup();

  const location = soup
    .find("span", { id: "resumator-job-location" })
    .text.split(",");

  for (let city in location) {
    if (location[city].trim().toLowerCase() === "remote") {
      return { foudedTown: "", county: "", remote: ["Remote"] };
    } else {
      const { foudedTown, county } = getTownAndCounty(
        translate_city(location[city].trim().toLowerCase())
      );
      return { foudedTown: foudedTown, county: county, remote: [] };
    }
  }
};

const url = "https://qualitance.com/careers/";

const company = { company: "Qualitance" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then(async (soup) => {
    const jobs = soup.findAll("div", { class: "career-item-wrap" });

    await Promise.all(
      jobs.map(async (job) => {
        const job_title = job.find("a").text.trim();
        const job_link = job.find("a").attrs.href;

        const { foudedTown, county, remote } = await getAditionalCity(job_link);

        finalJobs.push({
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: foudedTown,
          county: county,
          country: "Romania",
          remote: remote,
        });
      })
    );
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company, process.env.APIKEY);

    let logo =
      "https://tech.qualitance.com/hubfs/logo_new_whitebg-01.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
