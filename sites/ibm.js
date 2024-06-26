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
  let url =
    "https://jobsapi-internal.m-cloud.io/api/stjobbulk?organization=2242&limitkey=4A8B5EF8-AA98-4A8B-907D-C21723FE4C6B&facet=publish_to_cws:true&fields=id,ref,url,brand,title,level,open_date,department,sub_category,primary_city,primary_country,primary_category,addtnl_locations,language";

  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  for (const job of res.queryResult) {
    if (job.primary_country === "RO") {
      const job_title = job.title;
      const job_link = `https://careers.ibm.com/job/${job.id}`;
      const cities = [];
      cities.push(translate_city(job.primary_city.trim()));

      const aditional_locations = job.addtnl_locations;

      if (aditional_locations) {
        aditional_locations.forEach((location) => {
          cities.push(location.addtnl_city);
        });
      }

      let counties = [];

      for (const city of cities) {
        const { city: c, county: co } = await _counties.getCounties(city);

        if (c) {
          counties = [...new Set([...counties, ...co])];
        }
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties
      );

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "IBM";
  const logo =
    "https://cdn-static.findly.com/wp-content/uploads/sites/1432/2020/12/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
