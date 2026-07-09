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
  url = "https://eaton.eightfold.ai/api/pcsx/search?domain=eaton.com&query=&location=Romania&start=0&filter_distance=80&filter_include_remote=1";
  let scraper = new Scraper(url);
  let type = "JSON";
  let response = await scraper.get_soup(type);
  const pages = Math.ceil(response.data.count / 10);

  const fetchPages = async () => {
    const jobs = [];
    for (let page = 0; page < pages; page += 1) {
      
      const jobspage = response.data.positions.map((job) => {
        return {
          name: job.name,
          canonicalPositionUrl: job.positionUrl,
          locations: job.locations,
        };
      });
      jobs.push(...jobspage);
      scraper = new Scraper(
        `https://eaton.eightfold.ai/api/pcsx/search?domain=eaton.com&query=&location=Romania&start=${(page + 1) * 10}&filter_distance=80&filter_include_remote=1`,
      );
      response = await scraper.get_soup(type);
    }
    return jobs;
  };

  const seen = new Set();
  const elements = (await fetchPages()).filter(job => {
    if (seen.has(job.canonicalPositionUrl)) return false;
    seen.add(job.canonicalPositionUrl);
    return true;
  });

  for (const job of elements) {
    const job_title = job.name;
    const job_link = `https://eaton.eightfold.ai${job.canonicalPositionUrl}`;
    const cities = [];
    const counties = [];
    const locations = job.locations;
    for (const location of locations) {
      if (/\b(Romania|ROU|RO)\b/.test(location)) {
        const rawCity = location.split(",")[0].trim();
        if (rawCity && !["Romania", "ROU", "RO"].includes(rawCity)) {
          const obj = await _counties.getCounties(translate_city(rawCity));
          if (obj.city) {
            cities.push(obj.city);
            counties.push(...(obj.county || []));
          }
        }
      }
    }

    if (cities.length === 0) continue;

    jobs.push(generateJob(
      job_title, job_link, "Romania",
      [...new Set(cities)],
      [...new Set(counties.flat())]
    ));
  }

  return jobs;
};

const run = async () => {
  const company = "Eaton";
  const logo = "https://assets.jibecdn.com/prod/eaton/0.2.148/assets/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job