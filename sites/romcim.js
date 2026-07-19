const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://www.romcim.ro/cariere/locuri-de-munca-si-stagii/";
const decodeHtml = (text) =>
  text.replace(/&amp;/g, "&").replace(/&#039;/g, "'");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJobs = async () => {
  let soup;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const scraper = new Scraper(URL);
      scraper.config.headers["User-Agent"] = "Mozilla/5.0";
      scraper.config.timeout = 60000;
      soup = await scraper.get_soup("HTML");
      break;
    } catch (e) {
      if (attempt === 2) throw e;
      await delay(3000);
    }
  }
  const items = soup
    .findAll("div")
    .filter((node) => (node.attrs?.class || "").includes("accordion-item"));
  const jobs = [];

  for (const item of items) {
    const titleNode = item
      .findAll("p")
      .find(
        (node) =>
          (node.attrs?.class || "") === "text-large text-primary fw-bold mb-2",
      );
    const departmentNode = item
      .findAll("p")
      .find(
        (node) =>
          (node.attrs?.class || "") === "text-smallest text-primary mb-0",
      );

    if (!titleNode) {
      continue;
    }

    const titleText = decodeHtml(titleNode.text.trim());
    const parts = titleText.split(",");
    const cityLabel = translate_city(parts[parts.length - 1].trim());
    const { city, county } = await _counties.getCounties(cityLabel);
    const job_link = `${URL}#:~:text=${encodeURIComponent(titleText)}`;
    const job_title = departmentNode
      ? `${titleText} - ${departmentNode.text
          .replace("Departament:", "")
          .trim()}`
      : titleText;

    jobs.push(
      generateJob(
        job_title,
        job_link,
        "Romania",
        city || cityLabel,
        county || [],
      ),
    );
  }

  return jobs;
};

const run = async () => {
  const company = "Romcim";
  const logo =
    "https://www.romcim.ro/wp-content/uploads/2021/04/Artboard-1-1.png";
  let jobs = [];
  try {
    jobs = await getJobs();
  } catch (e) {
    console.log(`Failed to fetch jobs for ${company}: ${e.message}`);
  }

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
