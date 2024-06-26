const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url =
    "https://www.ing.jobs/global/careers/job-opportunities.htm?location_level_1=RO&start=0";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");

  const totalJobs = parseInt(
    soup
      .find("div", { class: "careers-search-results" })
      .findAll("h2")[2]
      .findAll("strong")[1]
      .text.trim()
  );

  const steps = Math.ceil(totalJobs / 50);

  const jobs = [];

  for (let step = 0; step < steps; step++) {
    const url = `https://www.ing.jobs/global/careers/job-opportunities.htm?location_level_1=RO&start=${
      step * 50
    }`;
    const s = new Scraper(url);
    const soup = await s.get_soup("HTML");

    const results = soup
      .find("div", { id: "vacancies" })
      .findAll("div", { class: "careers-search-result" });

    for (const job of results) {
      const job_title = job.find("h3").text.trim();
      const job_link =
        "https://www.ing.jobs" + job.find("h3").find("a").attrs.href;
      const city = "Bucuresti";
      const county = "Bucuresti";

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        city,
        county
      );

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "ING";
  const logo =
    "https://www.ing.jobs/static/ingdotcombasepresentation/static/img/logos/logo.hd.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
