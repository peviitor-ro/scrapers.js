const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getToken = async () => {
  const url =
    "https://marquardt-group.csod.com/ux/ats/careersite/5/home?c=marquardt-group&country=ro";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");
  const scripts = res.findAll("script", { type: "text/javascript" });

  let pattern = /"token":(.*),/g;

  let token;

  scripts.forEach((script) => {
    let match = script.text.match(pattern);

    if (match) {
      token = match[0].split(":")[1].split(",")[0].replace(/"/g, "");
    }
  });

  return token;
};

const data = {
  careerSiteId: 5,
  careerSitePageId: 5,
  pageNumber: 1,
  pageSize: 1000,
  cultureId: 1,
  searchText: "",
  cultureName: "en-US",
  states: [],
  countryCodes: ["ro"],
  cities: [],
  placeID: "",
  radius: null,
  postingsWithinDays: null,
  customFieldCheckboxKeys: [],
  customFieldDropdowns: [],
  customFieldRadios: [],
};

const getJobs = async () => {
  const token = await getToken();
  const apiurl = "https://uk.api.csod.com/rec-job-search/external/jobs";

  const res = await fetch(apiurl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());

  const items = res.data.requisitions;

  const jobs = [];

  for (const job of items) {
    const job_title = job.displayJobTitle;
    const job_link = `https://marquardt-group.csod.com/ux/ats/careersite/5/home/requisition/${job.requisitionId}?c=marquardt-group`;
    let city = job.locations[0].city || "Sibiu";

    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city.trim())
    );

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "Marquardt";
  const logo =
    "https://www.marquardt.ro/wp-content/uploads/2019/06/logo-mairon.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
