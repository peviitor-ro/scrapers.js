const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://preh8-portal.rexx-recruitment.com/job-offers.html";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const articles = soup.findAll("article", { class: "joboffer_container" });

  const jobs = [];

  for (const article of articles) {
    const linkNode = article.find("a");
    if (!linkNode) continue;

    const job_title = linkNode.text.trim();
    const job_link = linkNode.attrs.href;
    const locationEl = article.find("span", { class: "job_standort" });
    if (!locationEl) continue;

    const location = locationEl.text.trim();

    if (!location.includes("(Romania)")) continue;

    const city = translate_city(location.replace("(Romania)", "").trim());
    const { city: c, county } = await _counties.getCounties(city);

    jobs.push(
      generateJob(
        job_title,
        job_link,
        "Romania",
        c || city,
        county || [],
      ),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "Preh";
  const logo =
    "https://career.preh.com/fileadmin/templates/website/media/images/preh_logo.png";
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
