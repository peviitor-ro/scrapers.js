const puppeteer = require("puppeteer");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const JSSoup = require("jssoup").default;

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://careers.hilti.group/ro/locuri-de-munca/?search=&country=20000441&pagesize=100#results";

  const jobs = [];
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.5",
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const html = await page.content();
  const soup = new JSSoup(html);

  const items = soup.findAll("div", { class: "card-job" });

  for (const job of items) {
    const job_title = job.find("a").getText().trim();
    const job_link = `https://careers.hilti.group${job.find("a").attrs.href}`;
    let city = translate_city(
      job
        .find("li", { class: "list-inline-item" })
        .getText()
        .split(",")[0]
        .trim(),
    );

    const { city: c, county: co } = await _counties.getCounties(city);

    const job_element = generateJob(job_title, job_link, "Romania", c, co);

    jobs.push(job_element);
  }

  await browser.close();

  return jobs;
};

const run = async () => {
  const company = "Hilti";
  const logo = "https://careers.hilti.group/images/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
