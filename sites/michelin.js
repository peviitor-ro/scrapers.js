const axios = require("axios");
const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const API_URL =
  "https://michelinhr.wd3.myworkdayjobs.com/wday/cxs/michelinhr/Michelin/jobs";
const JOB_URL_PREFIX =
  "https://michelinhr.wd3.myworkdayjobs.com/en-US/Michelin";
const LIMIT = 20;

const getJobLocationsFromDetail = async (jobLink) => {
  const response = await axios.get(jobLink, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html",
    },
    responseType: "text",
  });

  const jsonLdText = String(response.data).match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i,
  )?.[1];

  if (!jsonLdText) {
    return [];
  }

  try {
    const data = JSON.parse(jsonLdText);
    const locality = data?.jobLocation?.address?.addressLocality || "";

    if (!locality) {
      return [];
    }

    return locality
      .split(/[;,]/)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const getCitiesAndCounties = async (locationNames) => {
  let cities = [];
  let counties = [];

  const locationCandidates = locationNames.flatMap((locationName) => {
    const trimmed = locationName.trim();
    const normalized = trimmed.replace(/\s+/g, " ");
    const withoutPrefix = normalized.replace(/^[A-Z]+\s+/, "");

    return [
      ...new Set([normalized, withoutPrefix, normalized.split(" ").pop()]),
    ].filter(Boolean);
  });

  for (const locationName of locationCandidates) {
    const cityName = translate_city(locationName);
    const { city, county } = await _counties.getCounties(cityName);

    if (city) {
      cities.push(city);
      counties = [...new Set([...counties, ...county])];
    }
  }

  return {
    cities: [...new Set(cities)],
    counties,
  };
};

const getJobs = async () => {
  const scraper = new Scraper(API_URL);
  scraper.config.headers = {
    ...scraper.config.headers,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const data = {
    appliedFacets: {
      Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"],
    },
    limit: LIMIT,
    offset: 0,
    searchText: "",
  };

  let response = await scraper.post(data);
  const jobs = [];
  const total = response.total || 0;
  const numberOfPages = Math.ceil(total / LIMIT);

  for (let pageIndex = 0; pageIndex < numberOfPages; pageIndex += 1) {
    const items = response.jobPostings || [];

    for (const item of items) {
      const job_title = item.title;
      const job_link = `${JOB_URL_PREFIX}${item.externalPath}`;
      const remote = item.remoteType ? [item.remoteType.toLowerCase()] : [];

      let rawLocations = item.locationsText
        .split(",")
        .map((location) => location.trim())
        .filter(Boolean);

      if (
        !rawLocations.length ||
        item.locationsText.includes("Locations") ||
        rawLocations.some((location) =>
          location.toLowerCase().startsWith("euromaster"),
        )
      ) {
        rawLocations = await getJobLocationsFromDetail(job_link);
      }

      const { cities, counties } = await getCitiesAndCounties(rawLocations);

      jobs.push(
        generateJob(job_title, job_link, "Romania", cities, counties, remote),
      );
    }

    data.offset += LIMIT;
    if (pageIndex < numberOfPages - 1) {
      response = await scraper.post(data);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Michelin";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/08/Michelin-logo-640x360.png";
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
