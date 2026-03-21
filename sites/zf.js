const { Scraper, postApiPeViitor, getParams } = require("peviitor_jsscraper");

const URL =
  "https://jobs.zf.com/search/?createNewAlert=false&q=&locationsearch=Romania&optionsFacetsDD_facility=&optionsFacetsDD_shifttype=&optionsFacetsDD_country=RO&optionsFacetsDD_customfield3=";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  await scraper.get_soup("HTML");
  return [];
};

const run = async () => {
  const company = "ZF";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/3/3f/ZF_Official_Logo.svg";
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
