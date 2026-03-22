const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const Jssoup = require("jssoup").default;
const axios = require("axios");

const _counties = new Counties();

const getJobDetails = async (jobId) => {
  const url = `https://jobs.jobvite.com/ness/job/${jobId}`;
  const res = await axios.get(url);
  const soup = new Jssoup(res.data);

  const scriptMatch = res.data.match(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (scriptMatch) {
    const json = JSON.parse(scriptMatch[1]);
    return {
      title: json.title,
      location: json.jobLocation
        ? json.jobLocation[0].address.addressLocality
        : null,
      url: url,
    };
  }
  return null;
};

const getJobs = async () => {
  const url = "https://jobs.jobvite.com/ness/jobs";
  const res = await axios.get(url);
  const soup = new Jssoup(res.data);
  const jobs = [];

  const text = res.data;
  const jobRe = /<a[^>]*href=['"]([^'"]*\/job\/[^'"]*)['"][^>]*>([^<]*)<\/a>/g;
  let match;
  const jobUrls = new Set();

  while ((match = jobRe.exec(text)) !== null) {
    const href = match[1];
    const title = match[2].trim();
    if (title && !jobUrls.has(href)) {
      jobUrls.add(href);
      const jobIdMatch = href.match(/\/job\/([a-zA-Z0-9]+)/);
      if (jobIdMatch) {
        const jobDetails = await getJobDetails(jobIdMatch[1]);
        if (jobDetails) {
          const { city: c, county: co } = await _counties.getCounties(
            translate_city(jobDetails.location || ""),
          );

          let counties = [];
          if (c) {
            counties = [...new Set([...counties, ...co])];
          }

          const job = generateJob(
            jobDetails.title,
            jobDetails.url,
            "Romania",
            c,
            counties,
          );
          jobs.push(job);
        }
      }
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Ness";
  const logo = "https://ness.com/wp-content/uploads/2020/10/ness-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
