"use strict";
const scraper = require("../peviitor_scraper.js");
let finalJobs = [];
const url = "https://www.pentasia.com/_sf/api/v1/jobs/search.json";
const company = { company: "Pentasia" };
const apiKey = process.env.KNOX;
const requestBody = {
  job_search: {
    query: "Romania",
    location: {
      address: "",
      radius: 0,
      region: "UK",
      radius_units: "miles",
    },
    filters: {},
    commute_filter: {},
    offset: 0,
    jobs_per_page: 100,
  },
};

const remoteBody = {
  job_search: {
    query: "",
    location: { address: "", radius: 0, region: "UK", radius_units: "miles" },
    filters: {
      "0966712f-eeae-4e12-a436-6f24c6a2d245": [
        "c841217b-4226-4fc0-bcc8-b3f6e43b40cb",
      ],
    },
    commute_filter: {},
    offset: 0,
    jobs_per_page: 100,
  },
};

const headers = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
};

(async () => {
  await fetch(url, {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: headers,
  })
    .then((response) => response.json())
    .then((responseData) => {
      let jobs = responseData.results;
      jobs.forEach((job) => {
        const jobTitle = job.job.title;
        const externalPath =
          "https://www.pentasia.com/jobs/" + job.job.url_slug;
        finalJobs.push({
          job_title: jobTitle,
          job_link: externalPath,
          country: "Romania",
          city: "Bucharest",
          company: company.company,
        });
      });
    });

  await fetch(url, {
    method: "POST",
    body: JSON.stringify(remoteBody),
    headers: headers,
  })
    .then((response) => response.json())
    .then((responseData) => {
      let jobs = responseData.results;
      jobs.forEach((job) => {
        const jobTitle = job.job.title;
        const externalPath =
          "https://www.pentasia.com/jobs/" + job.job.url_slug;
        finalJobs.push({
          job_title: jobTitle,
          job_link: externalPath,
          country: "Romania",
          remote: ["Remote"],
          company: company.company,
        });
      });
    });
})().then(() => {
  console.log(JSON.stringify(finalJobs, null, 2));
  scraper.postApiPeViitor(finalJobs, company, apiKey);
  let logo =
    "https://media.newjobs.com/clu/xpen/xpentasiaiex/branding/89914/PENTASIA-LIMITED-logo.png";
  let postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");
  postLogo.headers.headers["Content-Type"] = "application/json";
  postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
});
