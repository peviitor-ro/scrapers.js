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
    "https://careers.qualcomm.com/api/apply/v2/jobs?domain=qualcomm.com&profile=&query=romania&domain=qualcomm.com&sort_by=relevance";

  const scraper = new Scraper(url);
  const jobs = [];

  const res = await scraper.get_soup("JSON");

  const items = res.positions;

  for (const item of items) {
    const country = item.location.split(", ").pop();

    if (country.toLowerCase() !== "romania") continue;

    const job_title = item.name;
    const job_link = item.canonicalPositionUrl;
    const city = translate_city(item.location.split(", ")[0].trim());
    const county = (await _counties.getCounties(city)).county;

    const job = generateJob(job_title, job_link, city, county);
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
