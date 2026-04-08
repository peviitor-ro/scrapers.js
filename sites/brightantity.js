const puppeteer = require("puppeteer");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const urls = [
    "https://brightantity.com/engineering-product-development-rd/",
    "https://brightantity.com/it-software-development/",
  ];

  const jobs = [];
  const seenLinks = new Set();
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const elements = await page.$$("h2.eael-entry-title");

    for (const item of elements) {
      const titleElement = await item.$("a");
      if (titleElement) {
        const job_title = await titleElement.evaluate((el) =>
          el.textContent.trim(),
        );
        const job_link = await titleElement.evaluate((el) => el.href);

        if (!seenLinks.has(job_link)) {
          seenLinks.add(job_link);
          const job = generateJob(job_title, job_link, "Romania");
          jobs.push(job);
        }
      }
    }
  }

  await browser.close();
  return jobs;
};

const run = async () => {
  const company = "brightantity";
  const logo =
    "https://i0.wp.com/brightantity.com/wp-content/uploads/2020/08/1123Asset-2-1.png?resize=768%2C265&ssl=1";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
