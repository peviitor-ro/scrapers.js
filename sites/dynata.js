"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const apiKey = process.env.KNOX
const url = 'https://dynata.wd1.myworkdayjobs.com/wday/cxs/dynata/careers/jobs'  
const requestBody = {
  "appliedFacets":{"locations":["67cdbb242c0f01186560ab7ce9361603","67cdbb242c0f01ff4f8eac7ce9361d03"]},"limit":20,"offset":0,"searchText":""
};
const company = { company: "Dynata" };
let finalJobs = [];
fetch(url, {
  method: 'POST',
  body: JSON.stringify(requestBody),
  headers: { 
    'Content-Type':'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  }
})
  .then(response => response.json())
  .then(responseData => {
     const jobPostings = responseData.jobPostings;
     jobPostings.forEach(job => {
       const id = uuid.v4();
       const jobTitle = job.title;
       const externalPath = "https://dynata.wd1.myworkdayjobs.com/en-US/careers" + job.externalPath;
       finalJobs.push({
        id: id,
        job_title: jobTitle,
        job_link: externalPath,
        country: "Romania",
        city: "Romania",
        company: company.company,
      });
     });
   })
   .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company, apiKey);

    let logo =
      "https://www.dynata.com/wp-content/themes/dynata/images/dynata-logo.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));

   })
  











