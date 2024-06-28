const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

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

const getJobs = async () => {
  const url =
    "https://leoni.taleo.net/careersection/rest/jobboard/searchjobs?lang=ro&portal=101430233";

  const headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    tz: "GMT+03:00",
    tzname: "Europe/Bucharest",
  };
  const jobs = [];

  const res = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  }).then((res) => res.json());

  const totalJobs = parseInt(res.pagingData.totalCount);

  let step = 25;

  let pages = Math.ceil(totalJobs / step);

  for (let i = 1; i <= pages; i++) {
    data.pageNo = i;

    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    }).then((res) => res.json());

    const items = res.requisitionList;
    for (const job of items) {
      const job_title = job.column[0].trim();
      const job_link = `https://leoni.taleo.net/careersection/ro_romania/jobdetail.ftl?job=${job.contestNo}&tz=GMT%2B03%3A00&tzname=Europe%2FBucharest`;
      const city = translate_city(
        job.column[2].replace(/[\["(.*)"\]]/g, "").split("-")[2]
      );

      const { city: c, county: co } = await _counties.getCounties(city);

      const job_element = generateJob(job_title, job_link, "Romania", c, co);

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Leoni";
  const logo =
    "https://d1619fmrcx9c43.cloudfront.net/typo3conf/ext/leonisite/Resources/Public/Build/Images/logo-leoni.svg?1680705667";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
