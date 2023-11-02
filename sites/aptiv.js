"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const apiUrl = "https://essearchapi-na.hawksearch.com/api/v2/search/";

const company = { company: "Aptiv" };
let finalJobs = [];

const s = new scraper.ApiScraper(apiUrl);

let data = {
  ClientData: {
    UserAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Safari/605.1.15",
    VisitId: "b7b3d3b1-eeae-4fd9-8e8e-276d00975054",
    VisitorId: "c051d37f-a348-4a58-8d95-33e897fa9b3c",
    Custom: { custom: null },
  },
  Keyword: "",
  FacetSelections: { country: ["Romania"] },
  PageNo: 1,
  IndexName: "",
  IgnoreSpellcheck: false,
  IsInPreview: true,
  ClientGuid: "28fad22cfe584b879917858203dd97ce",
  Is100CoverageTurnedOn: false,
};

s.post(data).then((d, err) => {
  let pages = d.Pagination.NofPages;
  let totalJobs = d.Pagination.NofResults;

  const fetchData = () => {
    return new Promise((resolve) => {
      for (let i = 1; i <= pages; i++) {
        data.PageNo = i;
        s.post(data).then((d) => {
          d.Results.forEach((job) => {
            const job_title = job.Document.title[0];
            const job_link = job.Document.link[0];
            const city = job.Document.city[0].split("-");
            let foudedTown;
            let county;

            if (city.length > 1) {
              foudedTown = city[0].trim();
              county = city[1].trim();
            } else {
              const obj = getTownAndCounty(
                translate_city(city[0].toLowerCase().trim())
              );

              foudedTown = obj.foudedTown;
              county = obj.county;
            }

            if (foudedTown && county) {
              finalJobs.push({
                job_title: job_title,
                job_link: job_link,
                company: company.company,
                city: foudedTown,
                county: county,
                country: "Romania",
              });
            }
          });
          if (finalJobs.length === totalJobs) {
            resolve(finalJobs);
          }
        });
      }
    });
  };

  fetchData().then((finalJobs) => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://freight.cargo.site/w/3000/q/75/i/ab331f52d894b36d5310e73ce4781b5b30e2e169459c3d655c7ef56d660a0b0c/Asset-134096.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});
