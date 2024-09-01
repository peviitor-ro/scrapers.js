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
    "https://philips.wd3.myworkdayjobs.com/wday/cxs/philips/jobs-and-careers/jobs";

  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  let data = {
    appliedFacets: { locationHierarchy1: ["6e1b2a934716103c2addacb847bf00cc"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  let soup = await scraper.post(data);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total % limit === 0 ? total / limit : total / limit + 1
  );
  const jobs = [];

  

  for (let i = 0; i < numberOfPages; i += 1) {
    let items = soup.jobPostings;
    for (const item of items) {
      const job_title = item.title;

      const job_link_prefix =
        "https://philips.wd3.myworkdayjobs.com/en-US/jobs-and-careers";
      const job_link = job_link_prefix + item.externalPath;

      const separatorIndex = item.locationsText.indexOf(",");
      const city = translate_city(
        item.locationsText.substring(separatorIndex + 1)
      );

      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        c,
        counties
      );
      jobs.push(job_element);
    }
    data.offset = i * limit;
    soup = await scraper.post(data);
  }
  return jobs;
};

const run = async () => {
  const company = "Philips";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/05/Phillips-Logo-500x281.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
