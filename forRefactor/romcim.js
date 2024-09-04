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
  const url = "https://www.romcim.ro/cariere/locuri-de-munca-si-stagii/";

  const scraper = new Scraper(url);

  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const items = soup.find("ul", { class: "listare-joburi" }).findAll("li");

  for (const item of items) {
    const job_title = item.find("a").text.trim();
    const job_link = item.find("a").attrs.href;
    const location = translate_city(item.find("span").text.trim());

    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(location);

    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(job_title, job_link, "Romania", c, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Romcim";
  const logo =
    "https://www.romcim.ro/wp-content/uploads/2021/04/Artboard-1-1.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
