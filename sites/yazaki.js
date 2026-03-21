const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
  range,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://careers.yazaki.com/search/?q=&locationsearch=Romania";

const decodeHtml = (text) =>
  text.replace(/&amp;/g, "&").replace(/&#039;/g, "'");

const getLocationFromDetail = async (url) => {
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");
  const detailsText =
    soup.find("span", { class: "jobdescription" })?.findAll("p")?.[1]?.text ||
    "";
  const cityMatch = detailsText.match(/City:\s*([^\r\n]+)/i);
  const cityLabel = cityMatch?.[1]?.trim();

  if (!cityLabel) {
    return { city: null, county: [] };
  }

  const cityName = translate_city(cityLabel);
  const { city, county } = await _counties.getCounties(cityName);

  return {
    city: city || cityName,
    county: county || [],
  };
};

const getJobsFromPage = async (startrow = 0) => {
  const scraper = new Scraper(`${URL}&startrow=${startrow}`);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  const soup = await scraper.get_soup("HTML");
  const rows = soup.find("tbody")?.findAll("tr") || [];
  const jobs = [];

  for (const row of rows) {
    const titleNode = row.find("a", { class: "jobTitle-link" });
    const locationText =
      row.find("span", { class: "jobLocation" })?.text.trim() || "";

    if (
      !titleNode ||
      !(locationText.includes("RO") || locationText.includes("Romania"))
    ) {
      continue;
    }

    const job_title = decodeHtml(titleNode.text.trim());
    const job_link = decodeHtml(
      `https://careers.yazaki.com${titleNode.attrs.href}`,
    );
    const facilityText = row
      .find("span", { class: "jobFacility" })
      ?.text.trim();

    let city = null;
    let county = [];

    if (facilityText) {
      const cityName = translate_city(facilityText);
      const location = await _counties.getCounties(cityName);
      city = location.city || cityName;
      county = location.county || [];
    }

    if (!city || county.length === 0) {
      const detailLocation = await getLocationFromDetail(job_link);
      city = detailLocation.city || city;
      county =
        detailLocation.county.length > 0 ? detailLocation.county : county;
    }

    jobs.push(generateJob(job_title, job_link, "Romania", city, county));
  }

  return jobs;
};

const getJobs = async () => {
  const scraper = new Scraper(`${URL}&startrow=0`);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  const soup = await scraper.get_soup("HTML");
  const totalJobs = Number.parseInt(
    soup
      .find("span", { class: "paginationLabel" })
      ?.findAll("b")?.[1]
      ?.text.trim() || "0",
    10,
  );

  if (totalJobs === 0) {
    return [];
  }

  const jobs = [];

  for (const startrow of range(0, totalJobs, 25)) {
    const pageJobs = await getJobsFromPage(startrow);
    jobs.push(...pageJobs);
  }

  return jobs;
};

const run = async () => {
  const company = "Yazaki";
  const logo =
    "https://rmkcdn.successfactors.com/6779db45/43c1c988-2201-4a2f-bbf4-a.png";
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
