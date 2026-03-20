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

const getJobs = async () => {
  const scraper = new Scraper(URL);
  scraper.config.headers["User-Agent"] = "Mozilla/5.0";

  const soup = await scraper.get_soup("HTML");
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
