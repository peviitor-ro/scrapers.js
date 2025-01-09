const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const Jssoup = require("jssoup").default;

const _counties = new Counties();

const getHtml = async (url) => {
  const res = await fetch(url, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,ro;q=0.8",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-arch": '"arm"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-full-version": '"131.0.6778.205"',
      "sec-ch-ua-full-version-list":
        '"Google Chrome";v="131.0.6778.205", "Chromium";v="131.0.6778.205", "Not_A Brand";v="24.0.0.0"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"macOS"',
      "sec-ch-ua-platform-version": '"15.0.0"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-newrelic-id": "UgEAWVNaGwADXVNbBgQ=",
      "x-requested-with": "XMLHttpRequest",
    },
    referrer: "https://ness-usa.ttcportals.com/search/jobs?location=Romania",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  });

  const soup = new Jssoup(await res.text());
  return soup;
};

const getJobs = async () => {
  const url = "https://ness-usa.ttcportals.com/search/jobs/in/country/romania";
  let res = await getHtml(url);
  let page = 1;
  const jobs = [];

  var items = res.findAll("div", { class: "jobs-section__item" });

  while (items.length > 0) {
    for (const item of items) {
      const job_title = item.find("a").text.trim();
      const job_link = item.find("a").attrs.href;
      const city = item
        .find("div", { class: "large-4" })
        .text.split(",")[0]
        .replace("Location: ", "")
        .trim();

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city)
      );

      let counties = [];
      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }
    page += 1;
    res = await getHtml(url + "?page=" + page + "#");
    items = res.findAll("div", { class: "jobs-section__item" });
  }
  return jobs;
};

const run = async () => {
  const company = "Ness";
  const logo = "https://ness.com/wp-content/uploads/2020/10/ness-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
