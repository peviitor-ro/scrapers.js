const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
  range,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  let url =
    "https://careers.coca-colahellenic.com/ro_RO/careers/SearchJobs/?1293=%5B6003%5D&1293_format=2880&listFilterMode=1&projectRecordsPerPage=50";

  const jobs = [];
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const jobObject = res.findAll("div", { class: "article__header__text" });

  await Promise.all(
    jobObject.map(async (elem) => {
      const job_title = elem.find("a").text.trim();
      const job_link = elem.find("a").attrs.href;
      const cityArray =
        elem
          .find("span", { class: "list-item" })
          ?.text.trim()
          .match(/\((.*?)\)/) || [];

      let cities = [];
      let counties = [];
      let remote = [];

      if (cityArray && cityArray.length >= 2) {
        const city = translate_city(cityArray[1].replace("-", " "));
        const { city: c, county: co } = await _counties.getCounties(city);
        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
      }

      const job = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties,
        remote
      );
      jobs.push(job);
    })
  );
  return jobs;
};

const run = async () => {
  const company = "CocaColaHBC";
  const logo = "https://careers.coca-colahellenic.com/portal/5/images/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job

// "use strict";
// const scraper = require("../peviitor_scraper.js");
// const { getTownAndCounty } = require("../getTownAndCounty.js");
// const { translate_city } = require("../utils.js");

// const url =
//   "https://careers.coca-colahellenic.com/ro_RO/careers/SearchJobs/?1293=%5B6003%5D&1293_format=2880&listFilterMode=1&projectRecordsPerPage=50";

// const company = { company: "CocaColaHBC" };
// let finalJobs = [];
// const regex = /\((.*?)\)/;
// const apiKey = process.env.KNOX;
// const s = new scraper.Scraper(url);

// s.soup
//   .then((soup) => {
//     const jobs = soup.findAll("div", { class: "article__header__text" });
//     jobs.forEach((job) => {
//       const job_title = job.find("a").text.trim();
//       const job_link = job.find("a").attrs.href;
//       const cityArray = job
//         .find("span", { class: "list-item" })
//         .text.trim()
//         .match(regex);

//       let city = "";
//       let county = "";
//       const remote = [];
//       if (cityArray && cityArray.length >= 2) {
//         const obj = getTownAndCounty(
//           translate_city(cityArray[1].replace("-", " ").toLowerCase())
//         );
//         city = obj.foudedTown;
//         county = obj.county;
//       } else {
//         remote.push("Remote");
//       }

//       finalJobs.push({
//         job_title: job_title,
//         job_link: job_link,
//         company: company.company,
//         city: city,
//         county: county,
//         remote: remote,
//         country: "Romania",
//       });
//     });
//   })
//   .then(() => {
//     console.log(JSON.stringify(finalJobs, null, 2));
//     scraper.postApiPeViitor(finalJobs, company, apiKey);

//     let logo = "https://careers.coca-colahellenic.com/portal/5/images/logo.svg";

//     let postLogo = new scraper.ApiScraper(
//       "https://api.peviitor.ro/v1/logo/add/"
//     );
//     postLogo.headers.headers["Content-Type"] = "application/json";
//     postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
//   });
