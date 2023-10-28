const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, country, county, city) => ({
  job_title,
  job_link,
  country,
  county,
  city,
  remote: [],
});

const getJobs = async () => {
  const url = "https://www.kontron.ro/Jobs.ro.html";
  const scraper = new Scraper(url);
  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup
    .find("ul", { class: "filtered-item-list__items" })
    .findAll("li");

  jobsElements.forEach((job) => {
    const job_title = job
      .find("div", { class: "filtered-item-list__items__item__title" })
      .find("a")
      .text.trim();
    const job_link =
      "https://www.kontron.ro" +
      job
        .find("div", { class: "filtered-item-list__items__item__title" })
        .find("a").attrs.href;
    const city = job
      .find("div", { class: "filtered-item-list__items__item__location" })
      .find("a")
      .text.trim();

    const { foudedTown, county } = getTownAndCounty(
      translate_city(city.toLowerCase())
    );

    jobs.push(generateJob(job_title, job_link, "Romania", county, foudedTown));
  });

  return jobs;
};

const getParams = () => {
  const company = "kontron";
  const logo = "https://www.kontron.ro/kontron_Logo-RGB-2C.svg";
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
