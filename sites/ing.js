"use strict";
const scraper = require("../peviitor_scraper.js");

const url =
  "https://www.ing.jobs/global/careers/job-opportunities.htm?location_level_1=RO&start=0";
const company = { company: "ING" };

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  const logo =
    "https://www.ing.jobs" +
    soup.find("div", { class: "upper-header" }).find("img").attrs.src;

  let postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");

  postLogo.headers.headers["Content-Type"] = "application/json";

  postLogo.post(JSON.stringify([{ id: "ING", logo: logo }]));

  const totalJobs = parseInt(
    soup
      .find("div", { class: "careers-search-results" })
      .findAll("h2")[2]
      .findAll("strong")[1]
      .text.trim()
  );

  const steps = scraper.range(0, totalJobs, 50);

  let jobs = [];

  let fetchData = () => {
    return new Promise((resolve) => {
      for (let step in steps) {

        let url = `https://www.ing.jobs/global/careers/job-opportunities.htm?location_level_1=RO&start=${
          step * 50
        }`;
        const s = new scraper.Scraper(url);

        s.soup.then((soup) => {
          const results = soup
            .find("div", { id: "vacancies" })
            .findAll("div", { class: "careers-search-result" });

          results.forEach((job) => {
            const job_title = job.find("h3").text.trim();
            const job_link =
              "https://www.ing.jobs" + job.find("h3").find("a").attrs.href;

            jobs.push({
              job_title: job_title,
              job_link: job_link,
              company: company.company,
              city: "Bucuresti",
              county: "Bucuresti",
              country: "Romania",
            });
          });

          if (jobs.length === totalJobs) {
            resolve(jobs);
          }
        });
      }
    });
  };

  fetchData().then((jobs) => {
    console.log(JSON.stringify(jobs, null, 2));
    scraper.postApiPeViitor(jobs, company);
  });
});
