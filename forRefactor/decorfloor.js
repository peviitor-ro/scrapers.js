const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");

  let location;

  try {
    location = soup
      .find("div", { class: "wpb_wrapper" })
      .find("h4")
      .text.split("/")[0]
      .replace("Locatie:", "")
      .trim();
  } catch (error) {
    location = "Unknown";
  }

  let cities = [];
  let counties = [];

  const { city: c, county: co } = await _counties.getCounties(
    translate_city(location.trim())
  );

  if (c) {
    cities.push(c);
    counties = [...new Set([...counties, ...co])];
  }

  return { city: cities, county: counties }
};

const getJobs = async () => {
  const url = "https://decorfloor.ro/careers/";

  const scraper = new Scraper(url);
  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup.findAll("div", { class: "vc_gitem-col" });

  await Promise.all(
    jobsElements.map(async (elem) => {
      const job_title = elem.find("h4").text.trim();
      const job_link = elem.find("a").attrs.href;
      
      let cities = [];
      let counties = [];

      const { city: c, county: co } = await getAditionalCity(job_link);

      if (c) {
        cities.push(...c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", cities, counties);
      jobs.push(job);
    })
  );
  return jobs;
};

const run = async () => {
  const company = "Decorfloor";
  const logo = "https://decorfloor.ro/wp-content/uploads/2015/08/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
