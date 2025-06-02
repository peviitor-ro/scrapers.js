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
    "https://www.henkel.ro/ajax/collection/ro/1338824-1338824/queryresults/asJson?Locations_279384=Europe&Europe_877522=Romania&startIndex=0&loadCount=100&ignoreDefaultFilterTags=true";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const jobs = [];
  const items = res.results;
  for (const item of items) {
    const job_title = item.title;
    const job_link = "https://www.henkel.ro" + item.link;

    let city = "";
    try{
      city = translate_city(item.location.split(",")[1].trim());
    } catch {}
    
    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(city);

    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, "Romania", c, counties);
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "Henkel";
  const logo =
    "https://www.henkel.ro/resource/blob/737324/1129f40d0df611e51758a0d35e6cab78/data/henkel-logo-standalone-svg.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
