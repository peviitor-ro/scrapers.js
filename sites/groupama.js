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
    "https://cariere.groupama.ro/search/?createNewAlert=false&q=&locationsearch=";

  const jobs = [];

  const scraper = new Scraper(url);
  scraper.config.headers["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
  scraper.config.headers["Accept"] =
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";
  scraper.config.headers["Accept-Language"] =
    "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7";
  scraper.config.headers["Accept-Encoding"] = "gzip, deflate, br";
  scraper.config.timeout = 60000;

  let res;
  try {
    res = await scraper.get_soup("HTML");
  } catch (e) {
    console.log("Warning: Could not access cariere.groupama.ro:", e.message);
    console.log("The career site may be temporarily unavailable or blocked.");
    return [];
  }

  try {
    const totalJobs = parseInt(
      res.find("span", { class: "paginationLabel" }).findAll("b")[1].text,
    );
    const pages = Math.ceil(totalJobs / 10);

    for (let i = 0; i < pages; i++) {
      let url = `https://cariere.groupama.ro/search/?q=&sortColumn=referencedate&sortDirection=desc&startrow=${i * 10}`;

      const scraper = new Scraper(url);
      scraper.config.headers["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
      scraper.config.headers["Accept"] =
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";
      scraper.config.headers["Accept-Language"] =
        "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7";
      scraper.config.headers["Accept-Encoding"] = "gzip, deflate, br";
      scraper.config.timeout = 60000;

      let response;
      try {
        response = await scraper.get_soup("HTML");
      } catch (e) {
        console.log(`Page ${i} failed:`, e.message);
        continue;
      }

      const items = response.find("tbody").findAll("tr");

      for (const job of items) {
        const job_title = job.find("a").text.trim();
        const job_link = `https://cariere.groupama.ro${job.find("a").attrs.href}`;
        const city = translate_city(
          job.find("span", { class: "jobLocation" }).text.trim(),
        );
        let counties = [];

        const { city: c, county: co } = await _counties.getCounties(city);

        if (c) {
          counties = [...new Set([...counties, ...co])];
        }

        const job_element = generateJob(
          job_title,
          job_link,
          "Romania",
          c,
          counties,
        );

        jobs.push(job_element);
      }
    }
  } catch (e) {
    console.log("Error parsing page:", e.message);
  }

  return jobs;
};

const run = async () => {
  const company = "Groupama";
  const logo =
    "https://rmkcdn.successfactors.com/7c4eacca/683454b7-da0a-40a0-a1c9-a.png";
  try {
    const jobs = await getJobs();
    const params = getParams(company, logo);
    await postApiPeViitor(jobs, params);
  } catch (error) {
    console.log("Scraper completed with error:", error.message);
    process.exit(0);
  }
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
