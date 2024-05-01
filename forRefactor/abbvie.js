const Jssoup = require("jssoup").default;
const { Scraper, postApiPeViitor, generateJob, getParams } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const getJobs = async () => {
  const url =
    "https://careers.abbvie.com/en/jobs?q=&options=&page=1&ln=Romania&lr=100&li=RO";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "en-GB,en;q=0.9",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const html = res.results;
  const soup = new Jssoup(html);
  const items = soup.findAll("li", { class: "search-results__item" });
  const jobs = [];
  items.forEach((item) => {
    const job_title = item.find("h3").text.trim();
    const job_link = `https://careers.abbvie.com${
      item.find("a", { class: "search-results__job-link" }).attrs.href
    }`;
    let city = item
      .find("span", { class: "job-location" })
      .text.split(",")[0]
      .trim();

    if (city === "Timi&#x219;oara") {
      city = "Timisoara";
    }

    const { foudedTown, county } = getTownAndCounty(
      translate_city(city.toLowerCase())
    );

    console.log(foudedTown, county);

    const job = generateJob(job_title, job_link, city);
    jobs.push(job);
  });

  return jobs;
};

const run = async () => {
    const company = "Abbvie";
  const logo =
    "https://tbcdn.talentbrew.com/company/14/v2_0/img/abbvie-logo-color.svg";
  const jobs = await getJobs();
  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
