const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
  range,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  let url =
    "https://careers.celestica.com/search/?createNewAlert=false&q=&locationsearch=Romania&startrow=0";
  const jobs = [];
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const totalJobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  const pages = range(0, totalJobs, 25);

  const fetchData = async () => {
    let jobs = [];
    await Promise.all(
      pages.map(async (page) => {
        const url = `https://careers.celestica.com/search/?createNewAlert=false&q=&locationsearch=Romania&startrow=${page}`;
        const s = new Scraper(url);
        const res = await s.get_soup("HTML");
        const results = res.find("tbody").findAll("tr");
        results.forEach((job) => {
          jobs.push(job);
        });
      })
    );
    return jobs;
  };

  const jobsData = await fetchData();

  await Promise.all(
    jobsData.map(async (elem) => {
      const job_title = elem.find("a").text.trim();
      const job_link =
        "https://careers.celestica.com" + elem.find("a").attrs.href;
      const city = elem
        .find("span", { class: "jobLocation" })
        .text.split(",")[0]
        .trim();

      let cities = [];
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(translate_city(city));

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", cities, counties);
      jobs.push(job);
    })
  );

  return jobs;
};

const run = async () => {
  const company = "Celestica";
  const logo =
    "https://rmkcdn.successfactors.com/bcf7807a/f4737f7e-31d4-4348-963c-8.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job