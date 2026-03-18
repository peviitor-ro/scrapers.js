const https = require("https");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const BASE_URL = "https://careers.altenromania.ro";
const REQUEST_TIMEOUT = 15000;

const requestJson = (url) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json, text/plain, */*",
        },
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.setTimeout(REQUEST_TIMEOUT, () => {
      req.destroy(new Error(`Request timed out for ${url}`));
    });

    req.on("error", reject);
  });

const getPageData = async (page) => {
  const response = await requestJson(`${BASE_URL}/jds/${page}`);
  return JSON.parse(response.success?.message || "{}");
};

const getJobs = async () => {
  let firstPage;

  try {
    firstPage = await getPageData(1);
  } catch {
    return [];
  }

  const jobs = [];
  const pages = firstPage.pager?.pageCount || 0;

  for (let page = 1; page <= pages; page += 1) {
    const pageData = page === 1 ? firstPage : await getPageData(page);

    for (const job of pageData.recordList || []) {
      const location = (job.locatie || "").trim();
      const remote = location.includes("Remote") ? ["remote"] : [];
      let city = [];
      let county = [];

      if (remote.length === 0 && location) {
        const locationData = await _counties.getCounties(
          translate_city(location),
        );
        city = locationData.city || location;
        county = locationData.county || [];
      }

      jobs.push(
        generateJob(
          job.titlu,
          `${BASE_URL}/job/${job.id}`,
          "Romania",
          city,
          county,
          remote,
        ),
      );
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Alten";
  const logo = "https://careers.altenromania.ro/assets/img/svgs/logo.svg";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
