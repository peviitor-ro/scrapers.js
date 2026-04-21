const puppeteer = require("puppeteer");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL = "https://jobs.ssi-schaefer.com/go/All-Jobs/9108855/";

const getJobs = async () => {
  const jobs = [];
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const jobData = await page.evaluate(() => {
    const tiles = document.querySelectorAll(".job-tile");
    return Array.from(tiles).map((tile) => {
      const titleLink = tile.querySelector(".jobTitle-link");
      const locationDiv = tile.querySelector(".location");
      return {
        title: titleLink ? titleLink.textContent.trim() : null,
        link: titleLink ? titleLink.href : null,
        location: locationDiv ? locationDiv.textContent.trim() : null,
      };
    });
  });

  for (const job of jobData) {
    if (!job.title || !job.link || !job.location) {
      continue;
    }

    jobs.push(generateJob(job.title, job.link, "Romania", [], [], []));
  }

  await browser.close();
  return jobs;
};

const run = async () => {
  const company = "SSISchaefer";
  const logo =
    "https://www.ssi-schaefer.com/resource/crblob/480/a14c9a665a8272cc2b80687168a2e3d7/logo-ssi-schaefer-svg-data.svg";
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
