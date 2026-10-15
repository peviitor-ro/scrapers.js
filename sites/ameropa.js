const { postApiPeViitor, generateJob, getParams } = require("peviitor_jsscraper");

const URL = "https://www.ameropa.ro/ro/joburi-disponibile/";
const NO_JOBS_TEXT = "Momentan nu sunt posturi disponibile";
const TEXT_FRAGMENT_PREFIX = "#:~:text=";

const getJobs = async () => {
  const puppeteer = require("puppeteer-extra");
  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  const Jssoup = require("jssoup").default;

  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  let html;
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 180000 });
    await new Promise((resolve) => setTimeout(resolve, 8000));
    html = await page.content();
  } finally {
    await browser.close();
  }

  const soup = new Jssoup(html);
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
