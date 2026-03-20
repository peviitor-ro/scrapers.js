const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL = "https://careers.remarkable.group/jobs?location=Romania";

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];

  if (soup.text.includes("No jobs found")) {
    return jobs;
  }

  const jobElements = soup.findAll("li", { class: "w-full" });

  for (const jobElement of jobElements) {
    const linkNode = jobElement.find("a", { "data-turbo": "false" });

    if (!linkNode) {
      continue;
    }

    const job_title = linkNode.text.trim();
    const job_link = linkNode.attrs.href;
    jobs.push(generateJob(job_title, job_link, "Romania"));
  }

  return jobs;
};

const run = async () => {
  const company = "Sagittarius";
  const logo =
    "https://images.teamtailor-cdn.com/images/s3/teamtailor-production/logotype-v3/image_uploads/0bc756dc-2208-4bc4-a165-43028568414b/original.png";
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
