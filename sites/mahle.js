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
    "https://careers.mahle.com/search/?searchby=location&createNewAlert=false&optionsFacetsDD_country=RO";
  const scraper = new Scraper(url);
  scraper.config.headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
  };
  scraper.config.timeout = 60000;

  let res;
  try {
    res = await scraper.get_soup("HTML");
  } catch (error) {
    console.log("Warning: Could not access careers.mahle.com:", error.message);
    console.log("Attempting to use alternative portal jobs.mahle.com...");

    try {
      const altUrl = "https://www.jobs.mahle.com/romania/en/search/";
      const altScraper = new Scraper(altUrl);
      const altSoup = await altScraper.render_page();

      const jobs = [];

      const paginationSection = altSoup.find("div", { class: "pagination" });
      if (!paginationSection) {
        const jobItems = altSoup.findAll("div", { class: "job-item" });
        for (const job of jobItems) {
          const jobTitle = job.find("a", { class: "job-title" });
          const jobLink = "https://www.jobs.mahle.com" + jobTitle.attrs.href;
          const jobTitleText = jobTitle.text.trim();

          const locationDiv = job.find("div", { class: "location" });
          const city = locationDiv
            ? translate_city(locationDiv.text.trim())
            : "";

          const { city: c, county: co } = await _counties.getCounties(city);

          const job_element = generateJob(
            jobTitleText,
            jobLink,
            "Romania",
            c,
            co,
          );
          jobs.push(job_element);
        }
        return jobs;
      }

      const totaljobs = parseInt(paginationSection.findAll("b")[1].text.trim());
      const range = Math.ceil(totaljobs / 20);

      for (let num = 0; num < range; num += 20) {
        let url = `https://www.jobs.mahle.com/romania/en/search/?startrow=${num}`;
        const scraper = new Scraper(url);
        const soup = await scraper.render_page();
        const items = soup.findAll("div", { class: "job-item" });

        for (const job of items) {
          const jobTitle = job.find("a", { class: "job-title" });
          const jobLink = "https://www.jobs.mahle.com" + jobTitle.attrs.href;
          const jobTitleText = jobTitle.text.trim();

          const locationDiv = job.find("div", { class: "location" });
          const city = locationDiv
            ? translate_city(locationDiv.text.trim())
            : "";

          const { city: c, county: co } = await _counties.getCounties(city);

          const job_element = generateJob(
            jobTitleText,
            jobLink,
            "Romania",
            c,
            co,
          );
          jobs.push(job_element);
        }
      }

      return jobs;
    } catch (altError) {
      console.log("Alternative portal also unavailable:", altError.message);
      return [];
    }
  }

  const jobs = [];

  const totaljobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text.trim(),
  );
  const range = Math.ceil(totaljobs / 20);

  for (let num = 0; num < range; num += 20) {
    let url = `https://careers.mahle.com/search/?searchby=location&createNewAlert=false&optionsFacetsDD_country=RO&startrow=${num}`;
    const scraper = new Scraper(url);
    scraper.config.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
    };
    scraper.config.timeout = 60000;
    const soup = await scraper.get_soup("HTML");
    const items = soup
      .find("table", { id: "searchresults" })
      .find("tbody")
      .findAll("tr");

    for (const job of items) {
      const job_title = job.find("a").text.trim();
      const job_link = "https://careers.mahle.com" + job.find("a").attrs.href;
      const city = translate_city(
        job.find("span", { class: "jobLocation" }).text.split(",")[0].trim(),
      );

      const { city: c, county: co } = await _counties.getCounties(city);

      const job_element = generateJob(job_title, job_link, "Romania", c, co);

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Mahle";
  const logo =
    "https://rmkcdn.successfactors.com/5c90da23/c09e38db-cfd8-45b6-9300-8.png";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
