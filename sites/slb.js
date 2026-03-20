const axios = require("axios");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const JOBS_URL = "https://careers.slb.com/job-listing";
const SOURCE = "ATS_Jobs_Source - Prod";

const getCoveoConfig = async () => {
  const html = (
    await axios.get(JOBS_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
  ).data;

  const getValue = (field) =>
    html.match(new RegExp(`id="${field}"[^>]*value="([^"]+)"`))?.[1];

  return {
    organizationId: getValue("organizationId"),
    accessToken: getValue("accessToken"),
  };
};

const normalizeJobLink = (jobLink) =>
  jobLink.replace(/\s+\d+$/, "").replace(/;+/g, "&");

const normalizeCity = (cityName) =>
  translate_city(cityName || "")
    .trim()
    .replace(/-/g, " ");

const getCitiesAndCounties = async (cityName) => {
  const normalizedCity = normalizeCity(cityName);

  if (!normalizedCity || normalizedCity === "Multi-Location") {
    return { cities: [], counties: [] };
  }

  const { city, county } = await _counties.getCounties(normalizedCity);

  if (!city) {
    return { cities: [], counties: [] };
  }

  return { cities: [city], counties: [...new Set(county)] };
};

const getJobs = async () => {
  const { organizationId, accessToken } = await getCoveoConfig();

  const response = await axios.post(
    `https://${organizationId}.org.coveo.com/rest/search/v2`,
    {
      q: "Romania",
      numberOfResults: 50,
      firstResult: 0,
      aq: `@source==\"${SOURCE}\"`,
      sortCriteria: "relevancy",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  const jobs = [];
  const seen = new Set();

  for (const item of response.data.results || []) {
    const job = item.raw || {};
    const countries = Array.isArray(job.country)
      ? job.country
      : [job.country].filter(Boolean);

    if (!countries.includes("Romania")) {
      continue;
    }

    const job_title = job.title || item.title;
    const job_link = normalizeJobLink(job.uri || item.uri || "");

    if (!job_title || !job_link || seen.has(job_link)) {
      continue;
    }

    seen.add(job_link);

    const { cities, counties } = await getCitiesAndCounties(job.city);
    jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
  }

  return jobs;
};

const run = async () => {
  const company = "SLB";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/SLB_Logo_2022.svg/1024px-SLB_Logo_2022.svg.png";
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
