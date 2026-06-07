const axios = require("axios");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { translate_city } = require("../utils.js");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const ROMANIA_LOCATION_ID = 21273;
const WAYBACK_BASE = "https://web.archive.org/web/20241004080537";

const JOBS_URL = `${WAYBACK_BASE}/https://careers.ryanair.com/wp-json/wp/v2/ryanair-jobs-job?per_page=100`;

const ROMANIA_CHILD_IDS = new Set([
  21273, 21274, 21275, 21276, 21277,
]);

const getJobs = async () => {
  const { data: jobs } = await axios.get(JOBS_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const romaniaJobs = jobs.filter((job) =>
    (job["ryanair-jobs-location"] || []).some((id) =>
      ROMANIA_CHILD_IDS.has(id),
    ),
  );

  const result = [];

  for (const job of romaniaJobs) {
    const job_title = job.title.rendered.replace(/&#8211;/g, "-").trim();
    const job_link = job.link.replace(
      /https:\/\/web\.archive\.org\/web\/\d+\//,
      "",
    );

    const { city, county } = await _counties.getCounties(
      translate_city("Bucharest"),
    );

    result.push(
      generateJob(
        job_title,
        job_link,
        "Romania",
        city || "Bucuresti",
        county || ["Bucuresti"],
      ),
    );
  }

  return result;
};

const run = async () => {
  const company = "Ryanair";
  const logo =
    "https://1000logos.net/wp-content/uploads/2020/03/Ryanair-Logo-500x313.png";
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
