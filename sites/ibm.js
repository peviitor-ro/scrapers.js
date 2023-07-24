"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

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
        const id = uuid.v4();
        const job_title = job.title;
        const job_link = "https://careers.ibm.com/job/" + job.id;
        let city = "Romania";

        try {
          city = job.addtnl_locations[0].addtnl_city;
        } catch (error) {}

        finalJobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: city,
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