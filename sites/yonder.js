const querystring = require("querystring");
const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const JOBS_URL = "https://tss-yonder.com/job";
const API_URL = "https://tss-yonder.com/wp-admin/admin-ajax.php";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
};
const MANUAL_COUNTY_MAP = {
  Iasi: ["Iasi"],
};

const getNonce = async () => {
  const scraper = new Scraper(JOBS_URL);
  scraper.config.headers = { ...scraper.config.headers, ...DEFAULT_HEADERS };

  const soup = await scraper.get_soup("HTML");
  return soup.text.match(/"nonce":"(.*?)"/)?.[1] || null;
};

const getPageJobs = async (nonce, page) => {
  const scraper = new Scraper(API_URL);
  scraper.config.headers = {
    ...scraper.config.headers,
    ...DEFAULT_HEADERS,
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  };

  return scraper.post(
    querystring.stringify({
      p: page,
      action: "filter_jobs",
      nonce,
    }),
  );
};

const getJobs = async () => {
  const nonce = await getNonce();

  if (!nonce) {
    return [];
  }

  const firstPage = await getPageJobs(nonce, 1);
  const pages = firstPage.pages || 0;
  const jobs = [];

  for (let page = 1; page <= pages; page += 1) {
    const response = page === 1 ? firstPage : await getPageJobs(nonce, page);

    for (const job of response.jobs || []) {
      const cityName = translate_city(job.location.trim());
      const { city, county } = await _counties.getCounties(cityName);
      const remote = cityName.toLowerCase().includes("remote")
        ? ["remote"]
        : [];
      const finalCity = remote.length > 0 ? [] : city || cityName;
      const finalCounty =
        remote.length > 0 ? [] : MANUAL_COUNTY_MAP[cityName] || county || [];

      jobs.push(
        generateJob(
          job.title,
          job.url,
          "Romania",
          finalCity,
          finalCounty,
          remote,
        ),
      );
    }
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
