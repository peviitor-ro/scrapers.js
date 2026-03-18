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
  let offset = 0;
  const limit = 20;
  let total = 0;

  // Header needed for Workday API
  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  try {
    do {
      const body = {
        appliedFacets: {},
        limit: limit,
        offset: offset,
        searchText: "Romania",
      };

      const response = await axios.post(url, body, { headers });
      const data = response.data;
      total = data.total;
      const items = data.jobPostings || [];

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
        } catch (e) {
          // keep Romania job even if county lookup fails
        }

        jobs.push(
          generateJob(job_title, job_link, "Romania", cities, counties),
        );
      }

      offset += limit;
    } while (offset < total);
  } catch (e) {
    console.error("Error fetching Workday jobs:", e.message);
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
