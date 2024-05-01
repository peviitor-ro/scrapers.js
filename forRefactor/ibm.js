"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://jobsapi-internal.m-cloud.io/api/stjobbulk?organization=2242&limitkey=4A8B5EF8-AA98-4A8B-907D-C21723FE4C6B&facet=publish_to_cws:true&fields=id,ref,url,brand,title,level,open_date,department,sub_category,primary_city,primary_country,primary_category,addtnl_locations,language";

const company = { company: "IBM" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((response) => {
    const jobs = response.queryResult;

    jobs.forEach((job) => {
      if (job.primary_country === "RO") {
        const job_title = job.title;
        const job_link = "https://careers.ibm.com/job/" + job.id;
        const citys = [];
        const countys = [];

        const { foudedTown, county } = getTownAndCounty(
          translate_city(job.primary_city.trim().toLowerCase())
        );

        citys.push(foudedTown);
        countys.push(county);

        const aditional_locations = job.addtnl_locations;

        if (aditional_locations) {
          aditional_locations.forEach((location) => {
            citys.push(location.addtnl_city);
            countys.push(location.addtnl_state);
          });
        }

        finalJobs.push({
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: citys,
          county: countys,
          country: "Romania",
        });
      }
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://cdn-static.findly.com/wp-content/uploads/sites/1432/2020/12/logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
