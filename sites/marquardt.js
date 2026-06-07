const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getToken = async () => {
  const url =
    "https://marquardt-group.csod.com/ux/ats/careersite/5/home?c=marquardt-group&country=ro";

  const puppeteer = require("puppeteer");
  let browser;
  let token;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
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

  return token;
};

const data = {
  careerSiteId: 5,
  careerSitePageId: 5,
  pageNumber: 1,
  pageSize: 1000,
  cultureId: 1,
  searchText: "",
  cultureName: "en-US",
  states: [],
  countryCodes: [],
  cities: [],
  placeID: "",
  radius: null,
  postingsWithinDays: null,
  customFieldCheckboxKeys: [],
  customFieldDropdowns: [],
  customFieldRadios: [],
};

const getJobs = async () => {
  const token = await getToken();
  const apiurl = "https://uk.api.csod.com/rec-job-search/external/jobs";

  const response = await fetch(apiurl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const res = await response.json();

  const items = res.data.requisitions;

  const jobs = [];

  for (const job of items) {
    const roLocation = job.locations.find((loc) => loc.country === "RO");

    if (roLocation) {
      const job_title = job.displayJobTitle;
      const job_link = `https://marquardt-group.csod.com/ux/ats/careersite/5/home/requisition/${job.requisitionId}?c=marquardt-group`;
      let city = roLocation.city || "Sibiu";

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city.trim()),
      );

      const job_element = generateJob(job_title, job_link, "Romania", c, co);

      jobs.push(job_element);
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Marquardt";
  const logo =
    "https://www.marquardt.ro/wp-content/uploads/2019/06/logo-mairon.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);

  if (jobs.length > 0) {
    postApiPeViitor(jobs, params);
  } else {
    console.log(`No jobs found for ${company}.`);
  }
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
