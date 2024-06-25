// "use strict";
// const scraper = require("../peviitor_scraper.js");
// const { getTownAndCounty } = require("../getTownAndCounty.js");
// const { translate_city } = require("../utils.js");

// const url =
//   "https://jobsapi-internal.m-cloud.io/api/stjobbulk?organization=2242&limitkey=4A8B5EF8-AA98-4A8B-907D-C21723FE4C6B&facet=publish_to_cws:true&fields=id,ref,url,brand,title,level,open_date,department,sub_category,primary_city,primary_country,primary_category,addtnl_locations,language";

// const company = { company: "IBM" };
// let finalJobs = [];

// const s = new scraper.ApiScraper(url);

// s.get()
//   .then((response) => {
//     const jobs = response.queryResult;

//     jobs.forEach((job) => {
//       if (job.primary_country === "RO") {
//         const job_title = job.title;
//         const job_link = "https://careers.ibm.com/job/" + job.id;
//         const cities = [];
//         const countys = [];

//         const { foudedTown, county } = getTownAndCounty(
//           translate_city(job.primary_city.trim().toLowerCase())
//         );

//         cities.push(foudedTown);
//         countys.push(county);

//         const aditional_locations = job.addtnl_locations;

//         if (aditional_locations) {
//           aditional_locations.forEach((location) => {
//             cities.push(location.addtnl_city);
//             countys.push(location.addtnl_state);
//           });
//         }

//         finalJobs.push({
//           job_title: job_title,
//           job_link: job_link,
//           company: company.company,
//           city: cities,
//           county: countys,
//           country: "Romania",
//         });
//       }
//     });
//   })
//   .then(() => {
//     console.log(JSON.stringify(finalJobs, null, 2));

//     scraper.postApiPeViitor(finalJobs, company);

//     let logo =
//       "https://cdn-static.findly.com/wp-content/uploads/sites/1432/2020/12/logo.png";

//     let postLogo = new scraper.ApiScraper(
//       "https://api.peviitor.ro/v1/logo/add/"
//     );
//     postLogo.headers.headers["Content-Type"] = "application/json";
//     postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
//   });

const { translate_city } = require("../utils.js");
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
    "https://jobsapi-internal.m-cloud.io/api/stjobbulk?organization=2242&limitkey=4A8B5EF8-AA98-4A8B-907D-C21723FE4C6B&facet=publish_to_cws:true&fields=id,ref,url,brand,title,level,open_date,department,sub_category,primary_city,primary_country,primary_category,addtnl_locations,language";

  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  for (const job of res.queryResult) {
    if (job.primary_country === "RO") {
      const job_title = job.title;
      const job_link = `https://careers.ibm.com/job/${job.id}`;
      const cities = [];
      cities.push(translate_city(job.primary_city.trim()));

      const aditional_locations = job.addtnl_locations;

      if (aditional_locations) {
        aditional_locations.forEach((location) => {
          cities.push(location.addtnl_city);
        });
      }

      let counties = [];

      for (const city of cities) {
        const { city: c, county: co } = await _counties.getCounties(city);

        if (c) {
          counties = [...new Set([...counties, ...co])];
        }
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties
      );

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "IBM";
  const logo =
    "https://cdn-static.findly.com/wp-content/uploads/sites/1432/2020/12/logo.png";
  const jobs = await getJobs();
  console.log(jobs);
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
