const https = require("https");
const dns = require("dns");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL = "https://www.ameropa.ro/ro/joburi-disponibile/";
const NO_JOBS_TEXT = "Momentan nu sunt posturi disponibile";
const TEXT_FRAGMENT_PREFIX = "#:~:text=";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.httpsAgent = new https.Agent({
    lookup: (hostname, options, cb) => {
      if (hostname === "www.ameropa.ro") {
        return cb(null, "185.92.195.183", 4);
      }
      dns.lookup(hostname, options, cb);
    },
  });
  const soup = await scraper.get_soup("HTML");
  const jobs = [];
  const jobElements = soup.findAll("a", { class: "elementor-accordion-title" });

  for (const jobElement of jobElements) {
    const job_title = jobElement.text.trim();

    if (!job_title || job_title === NO_JOBS_TEXT) {
      continue;
    }

    const job_link = `${URL}${TEXT_FRAGMENT_PREFIX}${encodeURIComponent(
      job_title,
    )}`;
    jobs.push(
      generateJob(job_title, job_link, "Romania", "Constanta", "Constanta"),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "Ameropa";
  const logo =
    "https://www.ameropa.ro/wp-content/uploads/2021/06/Logo-Ameropa.webp";
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
