const axios = require("axios");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { translate_city } = require("../utils.js");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const JOBS_URL =
  "https://careers.ryanair.com/jobs/?ryanair-jobs-location=21273";

const getJobs = async () => {
  const response = await axios.get(JOBS_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const html = response.data;
  const jobs = [];
  const jobPattern = /<li class="job">([\s\S]*?)<\/li>/g;
  let match;

  while ((match = jobPattern.exec(html)) !== null) {
    const block = match[1];
    const titleMatch = block.match(
      /<h2 class="job__title"><a href="([^"]+)">([\s\S]*?)<\/a><\/h2>/,
    );

    if (!titleMatch) {
      continue;
    }

    const job_link = titleMatch[1];
    const job_title = titleMatch[2].replace(/&#8211;/g, "-").trim();

    const detailHtml = (
      await axios.get(job_link, {
        headers: { "User-Agent": "Mozilla/5.0" },
      })
    ).data;

    const locationBlock = [
      ...detailHtml.matchAll(
        /<div class="wp-block-ryanair-ryr-post-terms">\s*<p class="job-terms">([\s\S]*?)<\/p>/g,
      ),
    ]
      .map((entry) =>
        entry[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .find((entry) => entry.includes("Romania"));

    if (!locationBlock || !locationBlock.includes("Bucharest")) {
      continue;
    }

    const { city, county } = await _counties.getCounties(
      translate_city("Bucharest"),
    );

    jobs.push(
      generateJob(
        job_title,
        job_link,
        "Romania",
        city || "Bucuresti",
        county || ["Bucuresti"],
      ),
    );
  }

  return jobs;
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
