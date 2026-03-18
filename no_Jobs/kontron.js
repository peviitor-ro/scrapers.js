const { Scraper, postApiPeViitor, getParams } = require("peviitor_jsscraper");

const URL = "https://www.kontron.ro/online-services/oferte-de-munca";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  await scraper.get_soup("HTML");
  return [];
};

const run = async () => {
  const company = "Kontron";
  const logo = "https://www.kontron.ro/kontron_Logo-RGB-2C.svg";
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
