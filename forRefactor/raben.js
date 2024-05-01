const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const jsdom = require("jsdom");

class EditedScraper extends Scraper {
  async render_page() {
    const browser = await jsdom.JSDOM.fromURL(this.url, {
      runScripts: "dangerously",
    });
    browser.window.onload = function () {
      return this.window.__NUXT__.data[0].page.content.colPos0[1].content
        .offers;
    };
    return browser.window.onload();
  }
}

const generateJob = (job_title, job_link, city, country) => ({
  job_title,
  job_link,
  country,
  city,
});

const getJobs = async () => {
  const urls = [
    "https://romania.raben-group.com/cariere/lucratori-in-depozit",
    "https://romania.raben-group.com/cariere/pozitii-la-birou",
    "https://romania.raben-group.com/cariere/studenti-internship",
  ];

  let jobs = [];

  urls.forEach(async (url, idx) => {
    const scraper = new EditedScraper(url);
    const json = await scraper.render_page();

    for (let job of json) {
      jobs.push(generateJob(job.title, job.link.url, job.city, job.country));
    }
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(jobs);
    }, 2000);
  });
};

const getParams = () => {
  const company = "Raben";
  const logo = "https://romania.raben-group.com/Raben%20logo.svg";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
