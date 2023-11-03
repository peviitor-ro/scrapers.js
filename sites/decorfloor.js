"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const getAditionalCity = async (url) => {
  const s = new scraper.Scraper(url);
  const soup = await s.get_soup();

  let location;

  try {
    location = soup
      .find("div", { class: "wpb_wrapper" })
      .find("h4")
      .text.split("/")[0]
      .replace("Locatie:", "")
      .trim();
  } catch (error) {
    location = "Unknown";
  }

  const { foudedTown, county } = getTownAndCounty(
    translate_city(location.trim().toLowerCase())
  );
  return { foudedTown, county };
};
const url = "https://decorfloor.ro/careers/";

const company = { company: "Decorfloor" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then(async (soup) => {
    const jobs = soup.findAll("div", { class: "vc_gitem-col" });
    await Promise.all(
      jobs.map(async (job) => {
        const job_title = job.find("h4").text.trim();
        const job_link = job.find("a").attrs.href;

        const { foudedTown, county } = await getAditionalCity(job_link);

        if (foudedTown && county) {
          finalJobs.push({
            job_title: job_title,
            job_link: job_link,
            city: foudedTown,
            county: county,
            country: "Romania",
            company: company.company,
          });
        } else {
          finalJobs.push({
            job_title: job_title,
            job_link: job_link,
            city: ["Bucuresti", "Cluj-Napoca"],
            county: ["Bucuresti", "Cluj"],
            country: "Romania",
            company: company.company,
          });
        }
      })
    );
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo = "https://decorfloor.ro/wp-content/uploads/2015/08/logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
