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
  const url = "https://qualcomm.dejobs.org/rom/jobs/";

  const scraper = new Scraper(url);

  const jobs = [];

  const soup = await scraper.get_soup("HTML");

  const items = soup.findAll("li", { class: "direct_joblisting" });

  for (const item of items) {
    const job_title = item.find("a").text.trim();
    const job_link = "https://qualcomm.dejobs.org" + item.find("a").attrs.href;
    const location = translate_city(
      item.find("span", { class: "hiringPlace" }).text.split(",")[0].trim()
    );

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
  const company = "Qualcomm";
  const logo =
    "https://cdn.cookielaw.org/logos/b0a5f2cc-0b29-4907-89bf-3f6b380a03c8/0814c8dd-07ff-41eb-a1b0-ee0294137c9a/9ca69c31-5e86-432d-950c-cfa7fcaa3cc8/1280px-Qualcomm-Logo.svg.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
