const axios = require("axios");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL =
  "https://jobs.zf.com/search/?createNewAlert=false&q=&locationsearch=Romania&optionsFacetsDD_facility=&optionsFacetsDD_shifttype=&optionsFacetsDD_country=RO&optionsFacetsDD_customfield3=";

const axiosInstance = axios.create({
  timeout: 10000,
});

const getJobs = async () => {
  let soup;
  try {
    const response = await axiosInstance.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
      },
    });
    const Jssoup = require("jssoup").default;
    soup = new Jssoup(response.data);
  } catch (error) {
    console.log(
      `Network error fetching jobs from ${URL}, returning empty array`,
    );
    return [];
  }

  const jobs = [];

  const table = soup.find("table", { id: "searchresults" });
  const rows = table?.find("tbody")?.findAll("tr") || [];

  for (const row of rows) {
    const titleLink = row.find("a", { class: "jobTitle-link" });
    const locationText = row
      .find("span", { class: "jobLocation" })
      ?.text.trim();

    if (!titleLink || !locationText) {
      continue;
    }

    if (!locationText.includes(", RO") && !locationText.includes(", Romania")) {
      continue;
    }

    const job_title = titleLink.text.trim();
    const job_link = `https://jobs.zf.com${titleLink.attrs.href}`;
    const cityLabel = locationText.split(",")[0].trim();
    const city = translate_city(cityLabel);

    let cities = [];
    let counties = [];

    if (city) {
      const { city: c, county: co } = await _counties.getCounties(city);

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
  }

  return jobs;
};

const run = async () => {
  const company = "ZF";
  const logo =
    "https://upload.wikimedia.org/wikipedia/commons/3/3f/ZF_Official_Logo.svg";
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
