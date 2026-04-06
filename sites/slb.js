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
  const jobs = [];
  const url =
    "https://slb.eightfold.ai/api/pcsx/search?domain=slb.com&query=&location=Romania&start=0&filter_distance=80&filter_include_remote=1";

  let scraper = new Scraper(url);
  let type = "JSON";
  let response = await scraper.get_soup(type);
  const totalJobs = response.data.count;
  const pages = Math.ceil(totalJobs / 10);

  const fetchPages = async () => {
    const jobs = [];
    for (let page = 0; page < pages; page += 10) {
      const jobspage = response.data.positions.map((job) => {
        return {
          name: job.name,
          canonicalPositionUrl: job.positionUrl,
          locations: job.locations,
        };
      });
      jobs.push(...jobspage);
      scraper = new Scraper(
        `https://slb.eightfold.ai/api/pcsx/search?domain=slb.com&query=&location=Romania&start=${page}&filter_distance=80&filter_include_remote=1`,
      );
      response = await scraper.get_soup(type);
    }
    return jobs;
  };

  const elements = await fetchPages();

  for (const job of elements) {
    const job_title = job.name;
    const job_link = `https://slb.eightfold.ai${job.canonicalPositionUrl}`;
    let city;
    let county;
    const locations = job.locations;

    for (const location of locations) {
      if (
        location.includes("Romania") ||
        location.includes("ROU") ||
        location.includes("RO")
      ) {
        try {
          if (location.startsWith("Multi-Location")) {
            city = "Romania";
            county = [];
          } else {
            city = location.split(",")[0];
            const obj = await _counties.getCounties(
              translate_city(city.trim()),
            );
            city = obj.city;
            county = obj.county;
          }
        } catch (error) {
          city = location;
          const obj = await _counties.getCounties(translate_city(city.trim()));
          city = obj.city;
          county = obj.county;
        }

        jobs.push(generateJob(job_title, job_link, "Romania", city, county));
      }
    }
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
