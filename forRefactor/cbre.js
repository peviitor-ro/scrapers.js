const { translate_city, replace_char } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  let url =
    "https://careers.cbre.com/en_US/careers/SearchJobs/?9577=%5B17229%5D&9577_format=10224&listFilterMode=1&jobRecordsPerPage=100&";

  const jobs = [];

  const scraper = new Scraper(url);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";
  scraper.config.headers["Accept-Language"] = "en-GB,en;q=0.9";
  scraper.config.headers["Accept"] = "application/json";
  const type = "HTML";
  const res = await scraper.get_soup(type);
  const elements = res.findAll("article", { class: "article--result" });
  console.log(res.prettify());

  return jobs;
};

getJobs();

// "use strict";
// const scraper = require("../peviitor_scraper.js");
// const { translate_city, get_jobtype } = require("../utils.js");
// const { getTownAndCounty } = require("../getTownAndCounty.js");

// let url =
//   "https://careers.cbre.com/en_US/careers/SearchJobs/?9577=%5B17229%5D&9577_format=10224&listFilterMode=1&jobRecordsPerPage=100&";

// const company = { company: "CBRE" };
// let finalJobs = [];

// const s = new scraper.Scraper(url);

// s.soup
//   .then((soup) => {
//     const jobs = soup.findAll("article", { class: "article--result" });

//     jobs.forEach((job) => {
//       const job_title = job.find("a").text.trim();
//       const job_link = job.find("a").attrs.href;
//       const locations = job
//         .find("div", { class: "article__header__text__subtitle" })
//         .findAll("span")[2]
//         .text.trim()
//         .split("-");

//       const cities = [];
//       const counties = [];
//       const remote = get_jobtype(job_title.toLowerCase());

//       if (!remote.includes("remote")) {
//         const city = translate_city(locations[0].replace("&#039;", "").trim());
//         const { foudedTown, county } = getTownAndCounty(city);
//         cities.push(foudedTown);
//         counties.push(county);
//       }

//       finalJobs.push({
//         job_title: job_title,
//         job_link: job_link,
//         company: company.company,
//         country: "Romania",
//         city: cities,
//         county: counties,
//         remote: remote,
//       });
//     });
//   })
//   .then(() => {
//     console.log(JSON.stringify(finalJobs, null, 2));
//     scraper.postApiPeViitor(finalJobs, company);
//     let logo =
//       "https://www.logo.wine/a/logo/CBRE_Group/CBRE_Group-Logo.wine.svg";
//     let postLogo = new scraper.ApiScraper(
//       "https://api.peviitor.ro/v1/logo/add/"
//     );
//     postLogo.headers.headers["Content-Type"] = "application/json";
//     postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
//   });
