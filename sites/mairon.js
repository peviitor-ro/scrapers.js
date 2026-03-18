const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const https = require("https");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://cariere.mairon.ro";
  const scraper = new Scraper(url);

  scraper.config.headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  };

  scraper.config.httpsAgent = new https.Agent({ rejectUnauthorized: false });

  try {
    const res = await scraper.get_soup("HTML");
    const jobs = [];

    const items = res
      .find("div", { id: "jobs_list" })
      .findAll("div", { class: "col-md-9" });

    for (const job of items) {
      const job_title = job.find("h3").text.trim();
      const job_link = job.find("a").attrs.href;
      const city = job.find("p").text.trim();

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city),
      );

      const job_element = generateJob(job_title, job_link, "Romania", c, co);

      jobs.push(job_element);
    }

    return jobs;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
};

const run = async () => {
  const company = "Mairon";
  const logo =
    "https://www.mairon.ro/wp-content/uploads/2019/06/logo-mairon.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);

  if (jobs.length > 0) {
    postApiPeViitor(jobs, params);
  } else {
    console.log(`Joblist for ${company} is empty. Skipping API post.`);
  }
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
