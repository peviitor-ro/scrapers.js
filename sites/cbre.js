const { translate_city, get_jobtype } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL =
  "https://careers.cbre.com/en_US/careers/SearchJobs/?9577=%5B17229%5D&9577_format=10224&listFilterMode=1&jobRecordsPerPage=100&";

const getJobs = async () => {
  const jobs = [];
  const scraper = new Scraper(URL);

  scraper.config.headers["User-Agent"] = "Mozilla/5.0";
  scraper.config.headers["Accept-Language"] = "en-GB,en;q=0.9";

  const soup = await scraper.get_soup("HTML");
  const elements = soup.findAll("article", { class: "article--result" });

  for (const element of elements) {
    const titleLink = element.find("a");
    const locationText = element
      .find("div", { class: "article__header__text__subtitle" })
      ?.findAll("span")?.[2]
      ?.text.replace(/&#039;/g, "'")
      .trim();

    if (!titleLink || !locationText) {
      continue;
    }

    const job_title = titleLink.text.trim();
    const job_link = titleLink.attrs.href;
    const remote = get_jobtype(job_title.toLowerCase());
    let cities = [];
    let counties = [];

    if (!remote.includes("remote")) {
      const cityLabel = locationText.split("-")[0].replace(/'/g, "").trim();
      const city = translate_city(cityLabel);
      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    jobs.push(
      generateJob(job_title, job_link, "Romania", cities, counties, remote),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "CBRE";
  const logo =
    "https://www.logo.wine/a/logo/CBRE_Group/CBRE_Group-Logo.wine.svg";
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
