const axios = require("axios");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const CAREERS_URL = "https://comtimromania.ro/cariere";
const API_URL = "https://comtimromania.ro/api/cariere/load";

const normalizeBadge = (text) =>
  text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/ă/g, "a")
    .replace(/î/g, "i")
    .replace(/â/g, "a");

const extractJobBlocks = (html) =>
  html
    .split(
      '<div class="job-item pt-4 pb-3 d-flex flex-column flex-md-row justify-content-between">',
    )
    .slice(1);

const getLocations = async (badges) => {
  const cities = [];
  let counties = [];

  for (const badge of badges) {
    const normalized = normalizeBadge(badge);

    if (normalized.toLowerCase().includes("full-time")) {
      continue;
    }

    const translated = translate_city(normalized);
    const { city, county } = await _counties.getCounties(translated);

    if (city) {
      cities.push(city);
      counties = [...new Set([...counties, ...county])];
      continue;
    }

    if (normalized === "Cluj") {
      cities.push("Cluj-Napoca");
      counties = [...new Set([...counties, "Cluj"])];
    }
  }

  return { cities: [...new Set(cities)], counties };
};

const getJobs = async () => {
  const firstPage = await axios.post(
    API_URL,
    new URLSearchParams({ lang: "ro", page: "1" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  const totalPages = Number.parseInt(firstPage.data.totalPages || "1", 10);
  const pages = [firstPage.data];

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await axios.post(
      API_URL,
      new URLSearchParams({ lang: "ro", page: String(page) }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );

    pages.push(response.data);
  }

  const jobs = [];
  const seen = new Set();

  for (const page of pages) {
    const blocks = extractJobBlocks(page.html || "");

    for (const block of blocks) {
      const job_title = block
        .match(/<h5 class="mb-1">([\s\S]*?)<\/h5>/)?.[1]
        ?.trim();
      const job_link = block.match(
        /<a href="([^"]+)" class="btn btn-outline-light/,
      )?.[1];
      const badges = [
        ...block.matchAll(/<span class="badge[^"]*">([\s\S]*?)<\/span>/g),
      ]
        .map((match) =>
          match[1]
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);

      if (!job_title || !job_link || seen.has(job_link)) {
        continue;
      }

      seen.add(job_link);

      const { cities, counties } = await getLocations(badges);
      jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Smithfield";
  const logo = "https://comtimromania.ro/assets/images/logo-comtim.svg";
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
