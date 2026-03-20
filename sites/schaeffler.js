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
const SEARCH_URL =
  "https://jobs.schaeffler.com/search/?createNewAlert=false&q=&locationsearch=Romania&optionsFacetsDD_country=&optionsFacetsDD_customfield1=&optionsFacetsDD_shifttype=&optionsFacetsDD_lang=&optionsFacetsDD_customfield2=&optionsFacetsDD_customfield4=";
const TILES_URL =
  "https://jobs.schaeffler.com/tile-search-results/?q=&locationsearch=Romania&startrow=";

const decodeHtml = (text) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const getJobs = async () => {
  const scraper = new Scraper(SEARCH_URL);
  const res = await scraper.get_soup("HTML");
  const jobs = [];

  const totalJobs = Number.parseInt(
    res.text.match(/jobRecordsFound: parseInt\("(.*?)"\)/)?.[1] || "0",
    10,
  );

  if (totalJobs === 0) {
    return jobs;
  }

  const steps = range(0, totalJobs, 100);

  for (const step of steps) {
    const pageScraper = new Scraper(`${TILES_URL}${step}`);
    const page = await pageScraper.get_soup("HTML");
    const items = page.findAll("li", { class: "job-tile" });

    for (const item of items) {
      const linkNode = item.find("a");
      const cityNode = item.find("div", { class: "city" })?.find("div");

      if (!linkNode || !cityNode) {
        continue;
      }

      const job_title = decodeHtml(linkNode.text.trim());
      const job_link = decodeHtml(
        `https://jobs.schaeffler.com${linkNode.attrs.href}`,
      );
      const location = translate_city(cityNode.text.trim());
      const { city, county } = await _counties.getCounties(location);

      jobs.push(
        generateJob(
          job_title,
          job_link,
          "Romania",
          city || location,
          county || [],
        ),
      );
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Schaeffler";
  const logo = "https://www.schaeffler.com/favicon.ico";
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
