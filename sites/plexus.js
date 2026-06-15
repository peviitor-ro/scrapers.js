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
    "https://plexus.wd5.myworkdayjobs.com/wday/cxs/plexus/Plexus_Careers/jobs";

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://plexus.wd5.myworkdayjobs.com",
    Referer: "https://plexus.wd5.myworkdayjobs.com/en-US/Plexus_Careers",
  };

  const limit = 20;
  const data = {
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText: "Romania",
  };

  let response;
  try {
    response = await axios.post(url, data, { headers });
  } catch (e) {
    console.error("Plexus API unavailable:", e.message);
    return [];
  }

  const { total } = response.data;

  const numberOfPages = Math.ceil(total / limit);

  const jobs = [];

  for (let i = 0; i < numberOfPages; i += 1) {
    const items = response.data.jobPostings;
    for (const item of items) {
      const job_title = item.title;
      const job_link_prefix =
        "https://plexus.wd5.myworkdayjobs.com/en-US/Plexus_Careers";
      const job_link = job_link_prefix + item.externalPath;
      const location = translate_city(item.locationsText.split(",")[0]);

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(location);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }

    data.offset = (i + 1) * limit;
    try {
      response = await axios.post(url, data, { headers });
    } catch (e) {
      console.error("Plexus API pagination failed:", e.message);
      break;
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Plexus";
  const logo =
    "https://www.plexus.com/PlexusCDN/plexus/media/english-media/logos/Plexus-Logo-212x42.svg";
  let jobs = [];
  try {
    jobs = await getJobs();
  } catch (e) {
    console.error("Error fetching Plexus jobs:", e.message);
  }

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
