const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const API_URL =
  "https://careers.se.com/api/jobs?keywords=Romania&lang=en-US&page=1&sortBy=relevance&descending=false&internal=false";

const getRomaniaLocations = (jobElement) => {
  const locations = [];

  if (jobElement.country === "Romania") {
    locations.push({ city: jobElement.city, state: jobElement.state });
  }

  for (const location of jobElement.additional_locations || []) {
    if (location.country === "Romania") {
      locations.push({ city: location.city, state: location.state });
    }
  }

  return locations;
};

const getCitiesAndCounties = async (locations) => {
  const cities = [];
  let counties = [];

  for (const location of locations) {
    const cityName = translate_city(
      location.city || location.state || "",
    ).trim();

    if (!cityName) {
      continue;
    }

    if (cityName.toLowerCase() === "romania") {
      continue;
    }

    const { city, county } = await _counties.getCounties(cityName);

    if (city) {
      cities.push(city);
      counties = [...new Set([...counties, ...county])];
    }
  }

  return { cities: [...new Set(cities)], counties };
};

const getJobs = async () => {
  const scraper = new Scraper(API_URL);
  const res = await scraper.get_soup("JSON");
  const jobs = [];
  const items = res.jobs || [];

  for (const item of items) {
    const jobElement = item.data;
    const romaniaLocations = getRomaniaLocations(jobElement);

    if (romaniaLocations.length === 0) {
      continue;
    }

    const { cities, counties } = await getCitiesAndCounties(romaniaLocations);
    const remote = (jobElement.tags7 || []).map((value) => value.toLowerCase());

    jobs.push(
      generateJob(
        jobElement.title,
        jobElement.meta_data.canonical_url,
        "Romania",
        cities,
        counties,
        remote,
      ),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "SchneiderElectric";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Schneider_Electric_2007.svg/284px-Schneider_Electric_2007.svg.png?20150906005100";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
