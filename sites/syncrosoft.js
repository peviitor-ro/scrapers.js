const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL = "https://www.sync.ro/jobs.html";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];
  const titleNodes = soup
    .findAll("div")
    .filter((div) => (div.attrs?.class || "").includes("job_title"));

  for (const titleNode of titleNodes) {
    const job_title = titleNode.text.replace(/\s+New$/, "").trim();

    if (!job_title) {
      continue;
    }

    const job_link = `${URL}#:~:text=${encodeURIComponent(job_title)}`;
    jobs.push(
      generateJob(job_title, job_link, "Romania", ["Craiova"], ["Dolj"]),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "SyncROSoft";
  const logo =
    "https://www.sync.ro/oxygen-webhelp/template/resources/img/logo_syncrosoft.png";
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
