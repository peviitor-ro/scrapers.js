const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const entities = require("entities");

const _counties = new Counties();
const POSTS_URL =
  "https://tss-yonder.com/wp-json/wp/v2/posts?categories=5&per_page=100";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
};
const MANUAL_COUNTY_MAP = {
  Iasi: ["Iasi"],
};

const getJobs = async () => {
  const scraper = new Scraper(POSTS_URL);
  scraper.config.headers = { ...scraper.config.headers, ...DEFAULT_HEADERS };

  const posts = await scraper.get_soup("JSON");
  const jobs = [];

  for (const post of posts) {
    const postScraper = new Scraper(post.link);
    postScraper.config.headers = {
      ...postScraper.config.headers,
      ...DEFAULT_HEADERS,
    };

    const soup = await postScraper.get_soup("HTML");
    const metas = soup.findAll("meta");
    let ogTitle = "";

    for (const meta of metas) {
      if (meta.attrs.property === "og:title") {
        ogTitle = meta.attrs.content;
        break;
      }
    }

    const parts = ogTitle.split("|").map((s) => s.trim());
    const title = entities.decodeHTML(parts[0] || post.title.rendered);
    const location = parts[2] || "";
    const cityName = translate_city(location.trim());
    const { city, county } = await _counties.getCounties(cityName);
    const remote = cityName.toLowerCase().includes("remote")
      ? ["remote"]
      : [];
    const finalCity = remote.length > 0 ? [] : city || cityName;
    const finalCounty =
      remote.length > 0 ? [] : MANUAL_COUNTY_MAP[cityName] || county || [];

    jobs.push(
      generateJob(title, post.link, "Romania", finalCity, finalCounty, remote),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "Yonder";
  const logo =
    "https://tss-yonder.com/wp-content/themes/yonder/assets/images/logo.svg";
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
