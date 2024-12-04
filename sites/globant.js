const { translate_city, get_jobtype } = require("../utils.js");
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
    "https://career.globant.com/search/?createNewAlert=false&q=&optionsFacetsDD_department=&optionsFacetsDD_country=RO";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");
  const items = res.findAll("li", { class: "job-tile" });

  const jobs = [];

  for (const item of items) {
    const job_title = item.find("span", { class: "title" }).text.trim();
    const job_link = "https://career.globant.com" + item.attrs["data-url"];
    const country = "Romania";
    const citys_obj = item
      .find("div", { class: "location" })
      .find("div")
      .text.split(",");

    const remote = get_jobtype(
      item.find("div", { class: "location" }).find("div").text.toLowerCase()
    );

    let cities = [];
    let counties = [];

    for (const city_obj of citys_obj) {
      const city_Name = city_obj.split(",")[0].trim();
      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city_Name)
      );

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    const job = generateJob(
      job_title,
      job_link,
      country,
      cities,
      counties,
      remote
    );
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Globant";
  const logo =
    "https://seekvectorlogo.com/wp-content/uploads/2019/06/globant-vector-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
