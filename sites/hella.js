"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://hella.csod.com/ux/ats/careersite/3/home?c=hella&lq=Romania&pl=ChIJw3aJlSb_sUARlLEEqJJP74Q&date=WithinThirtyDays";

const s = new scraper.Scraper(url);

s.soup.then((soup) => {
  const scripts = soup.findAll("script", { type: "text/javascript" });

  let pattern = /"token":(.*),/g;

  let token;

  scripts.forEach((script) => {
    let match = script.text.match(pattern);

    if (match) {
      token = match[0].split(":")[1].split(",")[0].replace(/"/g, "");
    }
  });

  const apiurl = "https://uk.api.csod.com/rec-job-search/external/jobs";

  const data = {
    careerSiteId: 3,
    careerSitePageId: 3,
    pageNumber: 1,
    pageSize: 1000,
    cultureId: 1,
    searchText: "",
    cultureName: "en-US",
    states: [],
    countryCodes: [],
    cities: [],
    placeID: "ChIJw3aJlSb_sUARlLEEqJJP74Q",
    radius: null,
    postingsWithinDays: 30,
    customFieldCheckboxKeys: [],
    customFieldDropdowns: [],
    customFieldRadios: [],
  };

  const api = new scraper.ApiScraper(apiurl);

  api.headers.headers["Authorization"] = "Bearer " + token;

  let finalJobs = [];
  const company = { company: "Hella" };

  api
    .post(data)
    .then((d) => {
      const jobs = d.data.requisitions;

      jobs.forEach((job) => {
        const id = uuid.v4();
        const job_title = job.displayJobTitle;
        const job_link =
          "https://hella.csod.com/ux/ats/careersite/3/home/requisition/" +
          job.requisitionId +
          "?c=hella";
        const city = job.locations[0].city;

        finalJobs.push({
          id: id,
          job_title: job_title,
          job_link: job_link,
          company: company.company,
          city: city,
          country: "Romania",
        });
      });
    })
    .then(() => {
      console.log(JSON.stringify(finalJobs, null, 2));
      scraper.postApiPeViitor(finalJobs, company);
    });
});