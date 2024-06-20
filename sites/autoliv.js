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
  let url =
    "https://careerromania.autoliv.com/jobs/show_more?layout=card-image&page=1&section_color_preset=primary";
  const jobs = [];
  let page = 1;

  const scraper = new Scraper(url);
  const additionalHeaders = {
    Accept: "text/vnd.turbo-stream.html, text/html, application/xhtml+xml",
    "Sec-Fetch-Site": "same-origin",
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
  };

  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  let res = await scraper.get_soup("HTML");
  let elements = res.findAll("li");

  while (elements.length > 0) {
    for (const item of elements) {
      const jobsElements = item.findAll("span");
      const job_title = jobsElements[0].text.trim();
      const job_link = item.find("a").attrs.href;
      let remote = [];

      const location = jobsElements[3].text.trim().split(" ");
      const country = "Romania";
      const cities = [];
      let counties = [];

      const city = translate_city(location[1]);
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      try {
        const remoteElement = jobsElements[5].text.trim();
        remote = get_jobtype(remoteElement);
      } catch (error) {}

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

    page++;
    url = `https://careerromania.autoliv.com/jobs/show_more?layout=card-image&page=${page}&section_color_preset=primary`;
    scraper.url = url;
    res = await scraper.get_soup("HTML");
    elements = res.findAll("li");
  }
  return jobs;
};

const run = async () => {
  const company = "Autoliv";
  const logo =
    "https://images.teamtailor-cdn.com/images/s3/teamtailor-production/logotype-v3/image_uploads/d7b6d876-3ad3-4051-81a2-e6293d1694ec/original.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
