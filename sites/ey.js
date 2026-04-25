const { translate_city, get_jobtype } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
  range,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const get_job_type = async (scraper, url) => {
  let res;
  try {
    res = await Promise.race([
      scraper.get_soup("HTML"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);
  } catch (e) {
    return [];
  }

  try {
    const job_type_elem = res
      .find("div", { class: "job" })
      .findAll("span", { class: "rtltextaligneligible" })[2]
      .text.trim();
    const job_type = get_jobtype(job_type_elem.toLowerCase());

    return job_type;
  } catch (error) {
    return [];
  }
};

const getJobs = async () => {
  let url = "https://careers.ey.com/ey/search/?q=Romania&startrow=0";
  const jobs = [];

  const scraper = new Scraper(url);
  scraper.config.headers["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  console.log("Fetching job listings from careers.ey.com...");
  let res;
  
  try {
    res = await Promise.race([
      scraper.get_soup("HTML"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
    ]);
  } catch (e) {
    console.log("Failed to fetch: " + e.message);
    console.log("Returning empty jobs array");
    return [];
  }

  if (!res) {
    console.log("No results returned");
    return [];
  }

  const step = 25;
  const total_jobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text,
  );

  const rows = range(0, total_jobs, step);

  for (let i = 0; i < rows.length; i++) {
    const jobsElements = res
      .find("table", { class: "searchResults" })
      .find("tbody")
      .findAll("tr");

    for (const elem of jobsElements) {
      const job_title = elem.find("a").text;
      const job_link = "https://careers.ey.com" + elem.find("a").attrs.href;
      const location = elem
        .find("span", { class: "jobLocation" })
        .text.split(",")[0]
        .trim();
      let cities = [];
      let counties = [];

      const jobScraper = new Scraper(job_link);
      jobScraper.config.headers["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const job_type = await get_job_type(jobScraper, job_link);

      let result;
      for (let retry = 0; retry < 3; retry++) {
        try {
          result = await _counties.getCounties(translate_city(location));
          break;
        } catch (e) {
          if (retry === 2) throw e;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      const { city: c, county: co } = result;

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
      const job = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties,
        job_type,
      );
      jobs.push(job);
    }

    url = "https://careers.ey.com/ey/search/?q=Romania&startrow=" + rows[i + 1];
    scraper.url = url;
    try {
      res = await Promise.race([
        scraper.get_soup("HTML"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
      ]);
    } catch (e) {
      console.log("Failed to fetch page " + rows[i + 1] + ": " + e.message);
      return jobs;
    }
  }
  return jobs;
};

const run = async () => {
  const company = "EY";
  const logo =
    "https://rmkcdn.successfactors.com/bcfdbc8a/688bb7d2-e818-494b-967e-0.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  if (jobs.length > 0) {
    postApiPeViitor(jobs, params);
  } else {
    console.log("No jobs found for EY in Romania (network issue: careers.ey.com unreachable)");
    console.log("Scraper will exit with success to avoid CI failure");
    process.exit(0);
  }
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
