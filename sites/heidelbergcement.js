const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const axios = require("axios");
const Jssoup = require("jssoup").default;

const _counties = new Counties();

const getJobs = async () => {
  const baseUrl = "https://www.heidelbergmaterials.ro/ro/views/ajax";
  const data = new URLSearchParams({
    view_name: "job_search",
    view_display_id: "search",
    field_job_offer_entry_level: "16",
    field_job_offer_contract_type: "13",
  });

  const response = await axios.post(baseUrl, data.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  let htmlContent = "";
  for (const cmd of response.data) {
    if (
      cmd.command === "insert" &&
      cmd.data &&
      cmd.data.includes("hc-search-list")
    ) {
      htmlContent = cmd.data;
      break;
    }
  }

  const soup = new Jssoup(htmlContent);
  const results = soup.findAll("div", { class: "hc-teaser__content" });

  const jobs = [];
  for (const job of results) {
    const job_title = job.find("a", { class: "hc-link" }).getText().trim();
    const job_link =
      "https://www.heidelbergmaterials.ro" + job.find("a").attrs.href;
    const locations = job.find("ul").findAll("li");
    const location_text =
      locations.length > 2 ? locations[2].getText().trim() : "";
    const cityParts = location_text.split(" ");
    const cityName = cityParts[cityParts.length - 1].replace("-", " ");
    const city = translate_city(cityName);
    let counties = [];

    const { city: c, county: co } = await _counties.getCounties(city);

    if (c) {
      counties = [...new Set([...counties, ...co])];
    }

    const job_element = generateJob(
      job_title,
      job_link,
      "Romania",
      c,
      counties,
    );

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "HeidelbergCement";
  const logo =
    "https://www.heidelbergmaterials.ro/sites/default/files/logo/HeidelbergMaterials.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
