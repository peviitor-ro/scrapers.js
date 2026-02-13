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

const get_job_type = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HtML");

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

  let res = await scraper.get_soup("HTML");

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
      const job_type = await get_job_type(job_link);

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(location),
      );

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
    res = await scraper.get_soup("HTML");
  }
  return jobs;
};

const run = async () => {
  const company = "EY";
  const logo =
    "https://rmkcdn.successfactors.com/bcfdbc8a/688bb7d2-e818-494b-967e-0.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
