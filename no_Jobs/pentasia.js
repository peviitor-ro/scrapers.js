const { Scraper, postApiPeViitor, getParams } = require("peviitor_jsscraper");

const URL = "https://www.pentasia.com/cm/candidates/jobs";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  await scraper.get_soup("HTML");
  return [];
};

const run = async () => {
  const company = "Pentasia";
  const logo =
    "https://media.newjobs.com/clu/xpen/xpentasiaiex/branding/89914/PENTASIA-LIMITED-logo.png";
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
