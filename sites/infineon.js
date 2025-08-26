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
  let start = 0;
  const url = `https://jobs.infineon.com/api/apply/v2/jobs?domain=infineon.com&start=0&num=10&location=Romania&pid=563808958979269&domain=infineon.com&sort_by=relevance&triggerGoButton=true`;

  let scraper = new Scraper(url);
  let res = await scraper.get_soup("JSON");

  const jobs = [];

  let items = res.positions;
  while (items && items.length > 0) {
    for (const job of items) {
      const location = job.location.split(" ");
      if (location[location.length - 1].includes("Romania")) {
        const job_title = job.name;
        const job_link = job.canonicalPositionUrl;
        const remote = job.work_location_option.replace("onsite", "on-site");
        const locations = job.locations;
        const cities = [];
        let counties = [];
        for (let i = 0; i < locations.length; i++) {
          if (locations[i].includes("Romania")) {
            const city = translate_city(locations[i].split(" ")[0]);
            const { city: c, county: co } = await _counties.getCounties(city);
            if (c) {
              cities.push(c);
              counties = [...new Set([...counties, ...co])];
            }
            continue;
          }
        }

        const job_element = generateJob(
          job_title,
          job_link,
          "Romania",
          cities,
          counties,
          remote
        );

        jobs.push(job_element);
      }
    }
    start += 10;
    const new_url = url.split("&start=")[0] + `&start=${start}`;
    scraper = new Scraper(new_url);
    res = await scraper.get_soup("JSON");
    items = res.positions;
  }
  return jobs;
};

const run = async () => {
  const company = "Infineon";
  const logo =
    "https://www.infineon.com/frontend/release_2023-06-1/dist/resources/img/logo-desktop-en.png";
  const jobs = await getJobs();
    const params = getParams(company, logo);
    postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
