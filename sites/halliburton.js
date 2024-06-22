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
    "https://jobs.halliburton.com/search/?createNewAlert=false&q=&locationsearch=Romania";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let pages = Math.ceil(
    parseInt(
      res.find("span", { class: "paginationLabel" }).findAll("b")[1].text
    ) / 25
  );
  let items = res.find("tbody").findAll("tr");
  let isJobs = res.find("div", { id: "attention" });

  if (isJobs) {
    return [];
  }

  for (let i = 0; i < pages; i++) {
    for (const item of items) {
      const isRo = item
        .find("span", { class: "jobLocation" })
        .text.split(",")[2]
        .trim();

      if (isRo.toLowerCase() === "ro") {
        const job_title = item.find("a").text.trim();
        const job_link =
          "https://jobs.halliburton.com" + item.find("a").attrs.href;

        let city = translate_city(
          item.find("span", { class: "jobLocation" }).text.split(",")[0].trim()
        );

        let counties = [];
        const remote = [];

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
          remote
        );
        jobs.push(job_element);
      }
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Halliburton";
  const logo =
    "https://rmkcdn.successfactors.com/6fdd2711/8ba9d1d9-30b6-4c01-b093-b.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
