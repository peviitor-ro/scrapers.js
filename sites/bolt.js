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
  let url =
    "https://bolt.eu/en/careers/positions/?location=Romania-Bucharest&_rsc=yl102";
  const jobs = [];
  const scraper = new Scraper(url);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";
  const type = "HTML";
  const res = await scraper.get_soup(type);
  const modifiedText = res.text.replace(/\\/g, "");
  const rgx = /"parsedJobs":\[(.*?)\],"uniqueLocations":/gm;

  const jobsArray = JSON.parse(
    modifiedText
      .match(rgx)[0]
      .replace(',"uniqueLocations":', "")
      .replace(/"parsedJobs":/g, "")
  );

  for (const item of jobsArray) {
    let country = null;
    let loc = null;

    for (const location of item.header.locations) {

      if (location.country === "Romania"){
        country = location.country;
        loc = location.city;
      }
    }

    if (country !== "Romania") continue;

    let cities = [];
    let counties = [];
    const job_title = item.header.roleTitle;
    const job_link =
      "https://bolt.eu/" + item.body.applyLinkProps.linkProps.href;

    const city = translate_city(loc);
    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }
    const job = generateJob(job_title, job_link, country, cities, counties);

    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Bolt";
  const logo = "https://bolt.eu/bolt-logo-original-on-white.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
