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
  const res = await fetch(
    url,
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,ro;q=0.8",
        "cache-control": "max-age=0",
        priority: "u=0, i",
        "sec-ch-ua":
          '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );

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
