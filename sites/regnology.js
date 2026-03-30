const puppeteer = require("puppeteer");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url = "https://regnology.jobs.personio.de/?language=en";
  const jobs = [];
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 8000));

  const html = await page.content();
  await browser.close();

  const Jssoup = require("jssoup").default;
  const res = new Jssoup(html);
  const items = res.findAll("a", { class: "page_job__haA3E" });

  const romanianCities = ["Bucharest", "Timisoara", "Sibiu", "Cluj-Napoca"];

  items.forEach((item) => {
    const jobLink = item.attrs.href;
    const jobTitleElement = item.find("h3", { class: "page_jobTitle__K0ilk" });
    const job_title = jobTitleElement ? jobTitleElement.text.trim() : "";

    const metaDiv = item.find("div", { class: "page_jobMeta__GhU10" });
    const metaItems = metaDiv
      ? metaDiv.findAll("div", { class: "page_jobMetaItem__olmVi" })
      : [];

    let location = "";
    if (metaItems.length > 0) {
      const locationSpan = metaItems[0].find("span");
      location = locationSpan ? locationSpan.text.trim() : "";
    }

    let city = "";
    let county = "";

    const foundRomanianCity = romanianCities.find((c) => location.includes(c));

    if (foundRomanianCity) {
      city = foundRomanianCity;
      county = foundRomanianCity;
    }

    if (county && job_title) {
      const job_link = "https://regnology.jobs.personio.de" + jobLink;
      jobs.push(generateJob(job_title, job_link, "Romania", city, county));
    }
  });

  return jobs;
};

const run = async () => {
  const company = "Regnology";
  const logo =
    "https://www.regnology.net/project/frontend/build/logo-regnology.7537d456.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
