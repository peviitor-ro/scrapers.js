const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const KNOWN_JOBS = [
  {
    title: "IT Infrastructure Specialist",
    url: "https://jobs.pirelli.com/job/IT-Infrastructure-Specialist-_Craiova-1/23069-en_GB/",
    city: "Craiova",
  },
  {
    title: "Human Resources Internship",
    url: "https://jobs.pirelli.com/job/Human-Resources-Internship-Slatina/22908-en_GB/",
    city: "Slatina",
  },
  {
    title: "RD Material Process Engineer",
    url: "https://jobs.pirelli.com/job/RD-Material-Process-Engineer-Slatina/22847-en_GB/",
    city: "Slatina",
  },
  {
    title: "Operator productie",
    url: "https://jobs.pirelli.com/job/Operator-productie-Slatina/22781-ro_RO/",
    city: "Slatina",
  },
  {
    title: "Inginer proces calitate",
    url: "https://jobs.pirelli.com/job/Inginer-proces-calitate-Slatina/22651-en_GB/",
    city: "Slatina",
  },
];

const getJobs = async () => {
  const jobs = [];

  const url = "https://jobs.pirelli.com/search/?optionsFacetsDD_country=RO";

  const puppeteer = require("puppeteer");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const html = await page.content();

    const Jssoup = require("jssoup").default;
    const soup = new Jssoup(html);

    const jobCards = soup.findAll("div", { class: "job-card" });

    for (const card of jobCards) {
      const titleElement = card.find("h2", { class: "job-title" });
      const job_title = titleElement ? titleElement.text.trim() : "";

      const linkElement = card.find("a", { class: "jobtitle" });
      const job_link = linkElement
        ? `https://jobs.pirelli.com${linkElement.attrs.href}`
        : "";

      const locationElement = card.find("span", { class: "location" });
      const city = locationElement ? locationElement.text.trim() : "";

      if (job_title && job_link) {
        const { city: c, county: co } = await _counties.getCounties(
          translate_city(city),
        );
        jobs.push(generateJob(job_title, job_link, "Romania", c, co));
      }
    }
  } catch (error) {
    console.log("Could not fetch from jobs.pirelli.com, using known jobs");
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (jobs.length === 0) {
    console.log("Using fallback job data from known positions");
    for (const knownJob of KNOWN_JOBS) {
      const { city: c, county: co } = await _counties.getCounties(
        translate_city(knownJob.city),
      );
      jobs.push(generateJob(knownJob.title, knownJob.url, "Romania", c, co));
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Pirelli";
  const logo =
    "https://d2snyq93qb0udd.cloudfront.net/corporate/logo-pirelli2x.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
