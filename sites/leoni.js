"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const url =
  "https://leoni.taleo.net/careersection/rest/jobboard/searchjobs?lang=en&portal=101430233";
let data = {
  multilineEnabled: false,
  sortingSelection: {
    sortBySelectionParam: "3",
    ascendingSortingOrder: "false",
  },
  fieldData: {
    fields: { KEYWORD: "", LOCATION: "", CATEGORY: "" },
    valid: true,
  },
  filterSelectionParam: {
    searchFilterSelections: [
      { id: "POSTING_DATE", selectedValues: [] },
      { id: "LOCATION", selectedValues: ["627270431240"] },
      { id: "JOB_FIELD", selectedValues: [] },
      { id: "JOB_TYPE", selectedValues: [] },
      { id: "JOB_SCHEDULE", selectedValues: [] },
      { id: "JOB_LEVEL", selectedValues: [] },
    ],
  },
  advancedSearchFiltersSelectionParam: {
    searchFilterSelections: [
      { id: "ORGANIZATION", selectedValues: [] },
      { id: "LOCATION", selectedValues: [] },
      { id: "JOB_FIELD", selectedValues: [] },
      { id: "JOB_NUMBER", selectedValues: [] },
      { id: "URGENT_JOB", selectedValues: [] },
      { id: "EMPLOYEE_STATUS", selectedValues: [] },
      { id: "STUDY_LEVEL", selectedValues: [] },
      { id: "WILL_TRAVEL", selectedValues: [] },
      { id: "JOB_SHIFT", selectedValues: [] },
    ],
  },
  pageNo: 1,
};

const company = { company: "Leoni" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["tz"] = "GMT+03:00";

s.post(data).then((res) => {
  const totalJobs = parseInt(res.pagingData.totalCount);

  let step = 25;

  let pages = scraper.range(0, totalJobs, step);

  const fetcData = () => {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < pages.length; i++) {
        data.pageNo = i + 1;
        s.post(data).then((res) => {
          const jobs = res.requisitionList;
          jobs.forEach((job) => {
            const job_title = job.column[0].trim();
            const job_link = `https://leoni.taleo.net/careersection/ro_romania/jobdetail.ftl?job=${job.contestNo}&tz=GMT%2B03%3A00&tzname=Europe%2FBucharest`;
            const city = translate_city(
              job.column[2].replace(/[\["(.*)"\]]/g, "").split("-")[2]
            );

            const { foudedTown, county } = getTownAndCounty(city);

            finalJobs.push({
              job_title: job_title,
              job_link: job_link,
              company: company.company,
              city: foudedTown,
              county: county,
              country: "Romania",
            });

            if (finalJobs.length === totalJobs) {
              resolve(finalJobs);
            }
          });
        });
      }
    });
  };

  fetcData().then((finalJobs) => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://d1619fmrcx9c43.cloudfront.net/typo3conf/ext/leonisite/Resources/Public/Build/Images/logo-leoni.svg?1680705667";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});
