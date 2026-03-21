const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL =
  "https://xerox.avature.net/en_US/careers/SearchJobs/?5854=%5B970855%5D&5854_format=3770&listFilterMode=1&jobSort=relevancy&jobSortDirection=ASC&jobRecordsPerPage=100&";

const getLocation = async (locationText) => {
  const match = locationText.match(/City:\s*([^\n]+?)\s*State\/Province:/i);
  const cityLabel = match?.[1]?.trim();

  if (!cityLabel) {
    return { cities: [], counties: [] };
  }

  const normalizedCity = translate_city(cityLabel);
  const { city, county } = await _counties.getCounties(normalizedCity);
  const counties = normalizedCity === "Iasi" ? ["Iasi"] : county || [];

  return {
    cities: city ? [city] : [normalizedCity],
    counties,
  };
};

const getJobs = async () => {
  const jobs = [];
  const scraper = new Scraper(URL);

  scraper.config.headers["User-Agent"] = "Mozilla/5.0";
  scraper.config.headers["Accept-Language"] = "en-GB,en;q=0.9";

  const soup = await scraper.get_soup("HTML");
  const elements = soup.findAll("article", { class: "article--result" });

  for (const element of elements) {
    const titleLink = element.find("a");
    const subtitle = element
      .find("div", { class: "article__header__text__subtitle" })
      ?.text.trim();

    if (!titleLink || !subtitle || !subtitle.includes("Country: Romania")) {
      continue;
    }

    const { cities, counties } = await getLocation(subtitle);

    jobs.push(
      generateJob(
        titleLink.text.trim(),
        titleLink.attrs.href,
        "Romania",
        cities,
        counties,
      ),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "Xerox";
  const logo =
    "https://1000logos.net/wp-content/uploads/2017/05/Xerox-logo-768x369.png";
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
