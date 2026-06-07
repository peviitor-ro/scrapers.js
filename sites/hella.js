const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  let url =
    "https://hella.csod.com/ux/ats/careersite/3/home?c=hella&country=ro";

  const puppeteer = require("puppeteer");
  let browser;
  let token;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 180000 });

    const html = await page.content();

    const pattern = /csod\.context={.*?};/;
    const match = html.match(pattern);
    if (!match) {
      throw new Error("Could not find csod.context in page");
    }
    const contextJson = JSON.parse(
      match[0].replace("csod.context=", "").replace("};", "}")
    );
    token = contextJson.token;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    Authorization: `Bearer ${token}`,
  };

  const requestBody = {
    careerSiteId: 3,
    careerSitePageId: 3,
    pageNumber: 1,
    pageSize: 200,
    cultureId: 1,
    searchText: "",
    cultureName: "en-US",
    states: [],
    countryCodes: ["ro"],
    cities: [],
    placeID: "ChIJw3aJlSb_sUARlLEEqJJP74Q",
    radius: null,
    postingsWithinDays: null,
    customFieldCheckboxKeys: [],
    customFieldDropdowns: [],
    customFieldRadios: [],
  };

  const jobs = [];

  url = "https://uk.api.csod.com/rec-job-search/external/jobs";
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers,
  }).then((res) => res.json());

  const jobPostings = res.data.requisitions;

  for (const job of jobPostings) {
    const job_title = job.displayJobTitle;
    const job_link = `https://hella.csod.com/ux/ats/careersite/3/home/requisition/${job.requisitionId}?c=hella`;
    const locations = job.locations;
    const cities = [];
    let counties = [];

    for (const location of locations) {
      let city;
      try {
        city = translate_city(location.city.split(" ")[0]);
      } catch (error) {
        city = "Iasi";
      }

      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job_element = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties
      );

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Hella";
  const logo =
    "https://www.hella.com/hella-ro/assets/images/layout_global/ForviaHella_Logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
