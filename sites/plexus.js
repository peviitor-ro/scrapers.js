const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://plexus.wd5.myworkdayjobs.com/wday/cxs/plexus/Plexus_Careers/jobs";
  const scraper = new Scraper(url);

  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const limit = 20;
  const data = {
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText: "Romania",
  };

  let soup = await scraper.post(data);

  const { total } = soup;

  const numberOfPages = Math.ceil(total / limit);

  const jobs = [];

  for (let i = 0; i < numberOfPages; i += 1) {
    const items = soup.jobPostings;
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
    soup = await scraper.post(data);
  }
  return jobs;
};

const run = async () => {
  const company = "Plexus";
  const logo =
    "https://www.plexus.com/PlexusCDN/plexus/media/english-media/logos/Plexus-Logo-212x42.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
