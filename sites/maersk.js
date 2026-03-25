const axios = require("axios");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://maersk.wd3.myworkdayjobs.com/wday/cxs/maersk/Maersk_Careers/jobs";
  const jobs = [];
  const limit = 20;
  let offset = 0;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://maersk.wd3.myworkdayjobs.com",
    Referer: "https://maersk.wd3.myworkdayjobs.com/en-US/Maersk_Careers",
  };

  while (true) {
    const body = {
      appliedFacets: {},
      limit: limit,
      offset: offset,
      searchText: "",
    };

    let response;
    try {
      response = await axios.post(url, body, { headers });
    } catch (e) {
      if (e.response && e.response.status === 500) {
        break;
      }
      throw e;
    }

    const data = response.data;
    const items = data.jobPostings || [];

    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      const job_title = item.title;
      const externalPath = item.externalPath;
      const job_link = `https://maersk.wd3.myworkdayjobs.com/en-US/Maersk_Careers${externalPath}`;

      const locationText = item.locationsText || "";
      let country = "";
      let city = "";

      if (locationText.includes(",")) {
        const parts = locationText.split(",").map((s) => s.trim());
        country = parts[0];
        if (parts.length > 1) city = parts[1];
      } else if (locationText.includes(" - ")) {
        const parts = locationText.split(" - ").map((s) => s.trim());
        if (parts.length > 1) city = parts[1];

        if (parts[0].startsWith("RO")) country = "Romania";
      } else {
        country = locationText;
      }

      if (country !== "Romania") {
        continue;
      }

      let cities = [];
      let counties = [];

      try {
        const { city: c, county: co } = await _counties.getCounties(
          translate_city(city),
        );

        if (c) {
          cities.push(c);
        }

        if (co) {
          counties = [...new Set([...(Array.isArray(co) ? co : [co])])];
        }
      } catch (e) {}

      jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
    }

    offset += limit;
    if (offset >= data.total) {
      break;
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Maersk";
  const logo = "https://jobsearch.maersk.com/jobposting/img/logo-colored.png";
  let jobs = [];
  try {
    jobs = await getJobs();
  } catch (e) {
    console.error("Error fetching jobs:", e.message);
  }
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
