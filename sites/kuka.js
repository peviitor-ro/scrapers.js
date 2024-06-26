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
    "https://www.kuka.com/ro-ro/api/job/getjobs?searchrootpath=DCB6206EA76F4CCFAAC81F77D8E1FFC2&q=&filters=566D20CC38E347DCB896F0D8EA6A5F0D%7C531189ACEED942FE91E7F438219858C5";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");
  const items = res.items;
  const jobs = [];

  for (const job of items) {
    const job_title = job.headline;
    const job_link = job.href;
    const city = translate_city(job.facetsTop[0].split(",")[0].trim());

    const { city: c, county: co } = await _counties.getCounties(city);

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Kuka";
  const logo =
    "https://www.kuka.com/-/media/kuka-corporate/images/home/logos/kuka_logo.svg?rev=-1&hash=D89635BD83E7413E2F1D8545163A3AA1";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
