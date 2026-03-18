const { Scraper, postApiPeViitor, getParams } = require("peviitor_jsscraper");

const URL =
  "https://www.kuka.com/ro-ro/api/job/getjobs?searchrootpath=DCB6206EA76F4CCFAAC81F77D8E1FFC2&q=&filters=566D20CC38E347DCB896F0D8EA6A5F0D%7C531189ACEED942FE91E7F438219858C5";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  const response = await scraper.get_soup("JSON");
  return response.items || [];
};

const run = async () => {
  const company = "Kuka";
  const logo =
    "https://www.kuka.com/-/media/kuka-corporate/images/home/logos/kuka_logo.svg?rev=-1&hash=D89635BD83E7413E2F1D8545163A3AA1";
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
