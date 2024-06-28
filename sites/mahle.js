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
  const res = await scraper.get_soup("HTML");
  const jobs = [];

  const totaljobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text.trim()
  );
  const range = Math.ceil(totaljobs / 20);

  for (let num = 0; num < range; num += 20) {
    let url = `https://careers.mahle.com/search/?searchby=location&createNewAlert=false&optionsFacetsDD_country=RO&startrow=${num}`;
    const scraper = new Scraper(url);
    const soup = await scraper.get_soup("HTML");
    const items = soup
      .find("table", { id: "searchresults" })
      .find("tbody")
      .findAll("tr");

    for (const job of items) {
      const job_title = job.find("a").text.trim();
      const job_link = "https://careers.mahle.com" + job.find("a").attrs.href;
      const city = translate_city(
        job.find("span", { class: "jobLocation" }).text.split(",")[0].trim()
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
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
