"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://jobs.majorel.com/romania/en/jobs?lang=en&api=jobs&site=28&_";

const company = { company: "Majorel" };
let finalJobs = [];
let pages = 1;

const fetchData = (pages) => {
  return new Promise((resolve) => {
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
    const job_title = job.name;
    const job_link = job.url;
    let city = ["Bucuresti", "Brasov", "Sibiu"];
    let countys = ["Bucuresti", "Brasov", "Sibiu"];

    if (job.location != null && job.location.name != "") {
      const { foudedTown, county } = getTownAndCounty(
        translate_city(job.location.name.toLowerCase())
      );

      city = foudedTown;
      countys = county;
    }

    finalJobs.push({
      job_title: job_title,
      job_link: job_link,
      company: company.company,
      city: city,
      country: "Romania",
    });
  });

  console.log(JSON.stringify(finalJobs, null, 2));
  scraper.postApiPeViitor(finalJobs, company, process.env.APIKEY);
  let logo =
    "https://www.majorel.com/wp-content/themes/majorel/_frontend/assets/icons/logo.svg";

  let postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");
  postLogo.headers.headers["Content-Type"] = "application/json";
  postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
}

data();
