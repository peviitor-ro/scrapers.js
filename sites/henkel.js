const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
});

const getJobs = async () => {
  const url =
    "https://www.henkel.ro/ajax/collection/ro/1338824-1338824/queryresults/asJson?Locations_279384=Europe&Europe_877522=Romania&startIndex=0&loadCount=100&ignoreDefaultFilterTags=true";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const jobs = [];
  const items = res.results;
  items.forEach((item) => {
    const job_title = item.title;
    const job_link = "https://www.henkel.ro" + item.link;
    let city = translate_city(item.location.split(",")[1].trim().toLowerCase());

    const { foudedTown, county } = getTownAndCounty(
      city
    );

    const job = generateJob(job_title, job_link, foudedTown, county);
    jobs.push(job);
  });
  return jobs;
}

const getParams = () => {
  const company = "Henkel";
  const logo =
    "https://www.henkel.ro/resource/blob/737324/1129f40d0df611e51758a0d35e6cab78/data/henkel-logo-standalone-svg.svg";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs();
  console.log(jobs);
  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job