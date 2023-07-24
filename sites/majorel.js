"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://jobs.majorel.com/romania/en/jobs?lang=en&api=jobs&site=28&_";

const company = { company: "Majorel" };
let finalJobs = [];
let pages = 1;

const fetchData = (pages) => {
  return new Promise((resolve, reject) => {
    const url = `https://jobs.majorel.com/romania/en/jobs?pg=${pages}&lang=en&api=jobs&site=28&_`;
    const s = new scraper.ApiScraper(url);

    s.get().then((response) => {
      resolve(response); // Resolve with the response directly
    });
  });
};

async function data() {
  let jobs = [];
  let fetchedJobs;

  do {
    fetchedJobs = await fetchData(pages);
    fetchedJobs.forEach((element) => {
      jobs.push(element);
    });
    pages++;
  } while (fetchedJobs.length > 0);

  jobs.forEach((job) => {
    const id = uuid.v4();
    const job_title = job.name;
    const job_link = job.url;
    let city = "Romania";

    if (job.location != null) {
      if (job.location.name != "") {
        city = job.location.name;
      }
    }

    finalJobs.push({
      id: id,
      job_title: job_title,
      job_link: job_link,
      company: company.company,
      city: city,
      country: "Romania",
    });
  });

  console.log(JSON.stringify(finalJobs, null, 2));
  scraper.postApiPeViitor(finalJobs, company,process.env.Marcel);
  let logo =
    "https://www.majorel.com/wp-content/themes/majorel/_frontend/assets/icons/logo.svg";

  let postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");
  postLogo.headers.headers["Content-Type"] = "application/json";
  postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
}

data();
