"use strict";
const scraper = require("../peviitor_scraper.js");
const { translate_city } = require("../utils.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const url =
  "https://xerox.avature.net/en_US/careers/SearchJobs/?5854=%5B970855%5D&5854_format=3770&listFilterMode=1&jobSort=relevancy&jobSortDirection=ASC&jobRecordsPerPage=100&";

const company = { company: "Xerox" };
let finalJobs = [];

const s = new scraper.Scraper(url);

s.soup
  .then((soup) => {
    const jobs = soup.findAll("article", { class: "article--result" });

    jobs.forEach((job) => {
      const job_title = job.find("a").text.trim();
      const job_link = job.find("a").attrs.href;
      const city = job
        .find("div", { class: "article__header__text__subtitle" })
        .findAll("p")[0]
        .text.split(":")[1]
        .trim()
        .split(",");

      const cities = [];
      const _counties = [];

      city.forEach((city) => {
        const _city = translate_city(city.trim());
        const county = getTownAndCounty(_city);
        if (county.county) {
          cities.push(county.foudedTown);
          _counties.push(county.county);
        }
      });

      const job_element = {
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
      };

      if (_counties.length > 0) {
        job_element.city = cities;
        job_element.county = _counties;
      } else {
        job_element.remote = "Remote";
      }

      finalJobs.push(job_element);
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://1000logos.net/wp-content/uploads/2017/05/Xerox-logo-768x369.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
