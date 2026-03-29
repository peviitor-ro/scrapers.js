const puppeteer = require("puppeteer");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://bolt.eu/en/careers/positions/?location=Romania";
  const jobs = [];
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const html = await page.content();
  await browser.close();

  const modifiedText = html
    .replace(/\\/g, "")
    .replace(/"\$undefined"/g, "null")
    .replace(/"\$D/g, '"');

  const idRegex = /\{"id":"([^"]+)"/g;
  const roleRegex = /"roleTitle":"([^"]+)"/;
  const linkRegex = /"applyLinkProps":\{[^}]*"href":"([^"]+)"/;

  let idMatch;
  while ((idMatch = idRegex.exec(modifiedText)) !== null) {
    const objStart = idMatch.index;
    const nextObjStart = modifiedText.indexOf('{"id":"', objStart + 1);
    const objEnd =
      nextObjStart > 0
        ? nextObjStart - 1
        : modifiedText.indexOf(',"uniqueLocations"', objStart);

    const objSlice = modifiedText.substring(objStart, objEnd);

    const roleMatch = objSlice.match(roleRegex);
    const linkMatch = objSlice.match(linkRegex);

    if (!roleMatch || !linkMatch) continue;

    const job_title = roleMatch[1];
    const job_link = "https://bolt.eu" + linkMatch[1];

    const locMatches = [
      ...objSlice.matchAll(/"city":"([^"]+)","country":"([^"]+)"/g),
    ];
    for (const locMatch of locMatches) {
      const loc = locMatch[1];
      const country = locMatch[2];

      if (country !== "Romania") continue;

      let cities = [];
      let counties = [];

      const city = translate_city(loc);
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
      const job = generateJob(job_title, job_link, country, cities, counties);

      jobs.push(job);
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Bolt";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Bolt_logo.png/1200px-Bolt_logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
