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
  const url = "https://www.leoni.ro/en/jobs-portal";
  const scraper = new Scraper(url);

  scraper.config.headers["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  scraper.config.headers["Accept-Language"] = "en-US,en;q=0.9";
  scraper.config.timeout = 60000;

  const res = await scraper.get_soup("HTML");

  const jobs = [];
  const jobCards = res.findAll("a", { href: true }).filter(a => a.attrs.href?.includes("/jobs-portal/detail/"));

  for (const card of jobCards) {
    const cardText = card.text;

    const locationMatch = cardText.match(/Location:\s*([^,\n]+),\s*Romania/i);
    if (!locationMatch) continue;

    const jobTitle = cardText.substring(0, cardText.indexOf("Location:")).trim();
    const location = locationMatch[1].trim();

    const remoteMatch = cardText.match(/Type of job:\s*(\w+?)(?=Date|$)/i);
    const remote = remoteMatch ? remoteMatch[1].toLowerCase().replace("onsite", "on-site") : "on-site";

    const jobLink = "https://www.leoni.ro" + card.attrs.href;

    let cities = [];
    let counties = [];
    const city = translate_city(location);
    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    const job = generateJob(
      jobTitle,
      jobLink,
      "Romania",
      cities,
      counties,
      remote
    );
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "Leoni";
  const logo =
    "https://d1619fmrcx9c43.cloudfront.net/typo3conf/ext/leonisite/Resources/Public/Build/Images/logo-leoni.svg?1680705667";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
