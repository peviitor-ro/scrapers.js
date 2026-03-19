const https = require("https");
const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const URL = "https://ortec.com/en/careers/find-jobs/jobs?countries=romania";

const requestText = (url) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => resolve(body));
      },
    );

    req.setTimeout(15000, () => {
      req.destroy(new Error(`Request timed out for ${url}`));
    });

    req.on("error", reject);
  });

const getJobs = async () => {
  let body;

  try {
    body = await requestText(URL);
  } catch {
    return [];
  }

  const match = body.match(
    /\\"items\\":\[\{\\"title\\":\\"([^"\\]+)\\".*?\\"description\\":\\"([^"\\]+)\\".*?\\"url\\":\\"([^"\\]+)\\".*?\\"cardVariation\\":\\"career\\"/,
  );

  if (!match) {
    return [];
  }

  const [, job_title, city, jobPath] = match;
  const finalCity = translate_city(city);

  return [
    generateJob(
      job_title,
      `https://ortec.com${jobPath}`,
      "Romania",
      finalCity,
      ["Bucuresti"],
    ),
  ];
};

const run = async () => {
  const company = "Ortec";
  const logo =
    "https://media.academictransfer.com/LT8OEP2nAexUPaM9-WfgcP488FM=/fit-in/490x162/filters:upscale():fill(white)/logos/ortec-en-wide.jpg";
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
