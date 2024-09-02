const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");
const jsdom = require("jsdom");

const _counties = new Counties();

class EditedScraper extends Scraper {
  async render_page() {
    const browser = await jsdom.JSDOM.fromURL(this.url, {
      runScripts: "dangerously",
    });
    browser.window.onload = function () {
      return this.window.__NUXT__.data[0].t3page.content.colPos0[1].content
        .offers;
    };
    return browser.window.onload();
  }
}

const getJobs = async () => {
  const urls = [
    "https://romania.raben-group.com/cariere/lucratori-in-depozit",
    "https://romania.raben-group.com/cariere/pozitii-la-birou",
    "https://romania.raben-group.com/cariere/studenti-internship",
  ];

  let jobs = [];

  for (const url of urls) {
    const scraper = new EditedScraper(url);
    const json = await scraper.render_page();

    for (const item of json) {
      const job_title = item.title;
      const job_link = item.link;
      const job_city = translate_city(
        item.city.charAt(0).toUpperCase() + item.city.slice(1)
      );

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(job_city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Raben";
  const logo = "https://romania.raben-group.com/Raben%20logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
