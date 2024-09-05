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
  let url = "https://www.siiromania.ro/jobopportunities/#section";
  const jobs = [];
  let pages = 1;
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.find("tbody").findAll("tr");

  while (items.length > 0) {
    for (const item of items) {
      const jobtypes = [];

      const job_title = item.findAll("td")[0].text.trim();
      const job_link = item.findAll("td")[0].find("a").attrs.href;

      const city = translate_city(
        item.findAll("td")[2].text.split("-")[0].trim()
      );

      const { city: c, county: co } = await _counties.getCounties(city);

      let counties = [];

      if (c) {
        counties = new Set([...counties, ...co]);
      }

      if (city.includes("Remote") || city.includes("Hybrid")) {
        jobtypes.push(city.includes("Remote") ? "remote" : "hybrid");
      }

      const job = generateJob(
        job_title,
        job_link,
        "Romania",
        c,
        counties,
        jobtypes
      );
      jobs.push(job);
    }

    pages++;
    url = `https://www.siiromania.ro/jobopportunities/page/${pages}/#section`;
    scraper.url = url;
    res = await scraper.get_soup("HTML");
    try {
      items = res.find("tbody").findAll("tr");
    } catch (e) {
      items = [];
    }
  }
  return jobs;
};

const run = async () => {
  const company = "SII";
  const logo =
    "https://www.siiromania.ro/wp-content/themes/corporate-sii-romania/img/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
