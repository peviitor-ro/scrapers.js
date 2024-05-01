"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://marquardt-group.csod.com/ux/ats/careersite/5/home?c=marquardt-group&country=ro";

const company = { company: "Marquardt" };

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
    careerSiteId: 5,
    careerSitePageId: 5,
    pageNumber: 1,
    pageSize: 1000,
    cultureId: 1,
    searchText: "",
    cultureName: "en-US",
    states: [],
    countryCodes: ["ro"],
    cities: [],
    placeID: "",
    radius: null,
    postingsWithinDays: null,
    customFieldCheckboxKeys: [],
    customFieldDropdowns: [],
    customFieldRadios: [],
  };

  const api = new scraper.ApiScraper(apiurl);

  api.headers.headers["Authorization"] = "Bearer " + token;

  let finalJobs = [];

  api
    .post(data)
    .then((d) => {
      const jobs = d.data.requisitions;

      jobs.forEach((job) => {
        const job_title = job.displayJobTitle;
        const job_link =
          "https://marquardt-group.csod.com/ux/ats/careersite/5/home/requisition/" +
          job.requisitionId +
          "?c=marquardt-group";
        let city = job.locations[0].city;

        if (!city) {
          city = "Sibiu";
        }

        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.toLowerCase().trim())
        );

        finalJobs.push({
          job_title: job_title,
          job_link: job_link,
          country: "Romania",
          city: foudedTown,
          county: county,
          company: company.company,
        });
      });
    })
    .then(() => {
      console.log(JSON.stringify(finalJobs, null, 2));

      scraper.postApiPeViitor(finalJobs, company);

      let logo =
        "https://upload.wikimedia.org/wikipedia/commons/0/03/MarquardtGroup-Logo-CIColor-on-Transparent.svg";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});
