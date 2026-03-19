const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const axios = require("axios");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://careers.qualcomm.com/careers";

  const additionalHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Upgrade-Insecure-Requests": "1",
  };

  const response = await axios.get(url, {
    headers: additionalHeaders,
  });

  const cookies = response.headers["set-cookie"];
  let cookieString = "";
  if (cookies) {
    cookieString = cookies.map((c) => c.split(";")[0]).join("; ");
  }

  const html = response.data;
  require("fs").writeFileSync("qualcomm_debug.html", html);
  let csrfToken = response.headers["x-csrf-token"];
  if (!csrfToken) {
    const csrfMatch = html.match(/<meta name="_csrf" content="([^"]+)">/);
    csrfToken = csrfMatch ? csrfMatch[1] : null;
  }

  const apiUrl = "https://careers.qualcomm.com/api/apply/v2/jobs";

  const apiHeaders = {
    ...additionalHeaders,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Cookie: cookieString,
    Host: "careers.qualcomm.com",
    Origin: "https://careers.qualcomm.com",
    Pragma: "no-cache",
    Referer: "https://careers.qualcomm.com/careers",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "X-Csrf-Token": csrfToken,
    "X-Requested-With": "XMLHttpRequest",
  };
  delete apiHeaders["Upgrade-Insecure-Requests"];

  const payload = {
    domain: "qualcomm.com",
    query: "romania",
    sort_by: "relevance",
    start: 0,
    num: 100,
  };

  let apiResponse;
  try {
    apiResponse = await axios.get(apiUrl, {
      headers: apiHeaders,
      params: payload,
    });
  } catch (error) {
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
      console.error("Error data:", error.response.data);
    }
    throw error;
  }

  const items = apiResponse.data.positions;
  const jobs = [];

  for (const item of items) {
    const country = item.location.split(", ").pop();

    if (country.toLowerCase() !== "romania") continue;

    const job_title = item.name;
    const job_link = item.canonicalPositionUrl;
    const city = translate_city(item.location.split(", ")[0].trim());
    const county = (await _counties.getCounties(city)).county;

    const job = generateJob(job_title, job_link, city, county);
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "Qualcomm";
  const logo =
    "https://cdn.cookielaw.org/logos/b0a5f2cc-0b29-4907-89bf-3f6b380a03c8/0814c8dd-07ff-41eb-a1b0-ee0294137c9a/9ca69c31-5e86-432d-950c-cfa7fcaa3cc8/1280px-Qualcomm-Logo.svg.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
