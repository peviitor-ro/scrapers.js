const { Scraper, postApiPeViitor, getParams } = require("peviitor_jsscraper");

const URL =
  "https://careers.cognizant.com/global-en/jobs/?keyword=&location=Romania&radius=100&lat=&lng=&cname=Romania&ccode=RO&pagesize=100#results";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  try {
    await scraper.get_soup("HTML");
  } catch {
    return [];
  }

  return [];
};

const run = async () => {
  const company = "CognizantSoftvision";
  const logo =
    "https://www.cognizantsoftvision.com/react-images/logos/logo-header.png";
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
