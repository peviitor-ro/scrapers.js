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
const URL =
  "https://jobs.vitesco-technologies.com/ro/search/?q=&locationsearch=Romania";
const MANUAL_COUNTY_MAP = {
  Iasi: ["Iasi"],
};

const decodeHtml = (text) =>
  text.replace(/&amp;/g, "&").replace(/&#039;/g, "'");

const getJobsFromPage = async (startrow = 0) => {
  const scraper = new Scraper(`${URL}&startrow=${startrow}`);
  const soup = await scraper.get_soup("HTML");
  const rows =
    soup.find("table", { id: "searchresults" })?.find("tbody")?.findAll("tr") ||
    [];
  const jobs = [];

  for (const row of rows) {
    const linkNode = row.find("a");
    const locationText = row
      .find("span", { class: "jobLocation" })
      ?.text.trim();

    if (!linkNode || !locationText) {
      continue;
    }

    const job_title = decodeHtml(linkNode.text.trim());
    const job_link = decodeHtml(
      `https://jobs.vitesco-technologies.com${linkNode.attrs.href}`,
    );
    const cityName = translate_city(locationText.split(",")[0].trim());
    const { city, county } = await _counties.getCounties(cityName);
    const finalCounty = MANUAL_COUNTY_MAP[cityName] || county || [];

    jobs.push(
      generateJob(
        job_title,
        job_link,
        "Romania",
        city || cityName,
        finalCounty,
      ),
    );
  }

  return jobs;
};

const getJobs = async () => {
  const scraper = new Scraper(URL);
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

  const starts = range(0, totalJobs, 25);
  const jobs = [];

  for (const start of starts) {
    const pageJobs = await getJobsFromPage(start);
    jobs.push(...pageJobs);
  }

  return jobs;
};

const run = async () => {
  const company = "VitescoTechnologies";
  const logo =
    "https://rmkcdn.successfactors.com/c3583d3f/1a27f760-8f11-480e-b76b-f.png";
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
