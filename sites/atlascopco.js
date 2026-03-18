const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://8OHXBVRL00-dsn.algolia.net/1/indexes/BUSINESS_RO-RO/query";
  const body = {
    params:
      'hitsPerPage=100&filters=data.recordType:CONTENT_PAGE AND data.location:"/content/cl-ma-sp/ro-ro/jobs"',
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": "8OHXBVRL00",
      "X-Algolia-API-Key": "8160684f83578edaf76910a29d14395e",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const jobs = [];

  const excludedPaths = [
    "/ro-ro/jobs/job-overview",
    "/ro-ro/jobs/our-values-and-culture",
    "/ro-ro/jobs/meet-our-colleagues",
    "/ro-ro/jobs/benefits-and-well-being",
    "/ro-ro/jobs/keep-on-learning",
    "/ro-ro/jobs/get-to-know-our-culture",
    "/ro-ro/jobs/explore-our-brands",
    "/ro-ro/jobs/student-opportunities",
    "/ro-ro/jobs/atlas-copco-locuri-de-munca-egalitate-vs-echitate",
  ];

  for (const item of data.hits) {
    const externalPath = item.data.externalPath || "";

    // Skip if path is exactly one of the excluded paths or starts with an excluded path
    const isExcluded =
      excludedPaths.some((path) => externalPath.includes(path)) ||
      externalPath.endsWith("/ro-ro/jobs");

    if (isExcluded) continue;

    // Also skip if title is generic AND description doesn't look like a job role
    let job_title = item.data.title;
    const description = (item.data.description || []).join(" ");

    // Extract clearer title from description if title is generic
    if (
      job_title.includes("O cultură globală") ||
      job_title.includes("Simţiţi-vă ca acasă") ||
      (!job_title.includes("Inginer") &&
        !job_title.includes("Tehnician") &&
        !job_title.includes("Manager") &&
        !job_title.includes("Specialist") &&
        !job_title.includes("Coordinator") &&
        !job_title.includes("Expert"))
    ) {
      // Try to find "Rolul de ..." and stop before a new sentence (Capital letter)
      const roleMatch = description.match(
        /Rolul de (.*?)(?=(\.|!|\?| Ești| Ai| Să| În| Pentru)|$)/,
      );
      if (roleMatch) {
        job_title = roleMatch[1].trim();
      } else if (externalPath.includes("/jobs/")) {
        // Fallback to slug
        const slug = externalPath.split("/").pop();
        // Remove extension if present
        const cleanSlug = slug.replace(".html", "");
        // Replace dashes with spaces and capitalize
        job_title = cleanSlug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        // If slug is just "jobs" or similar generic, skip
        if (
          job_title.toLowerCase() === "jobs" ||
          job_title.toLowerCase().includes("job overview")
        )
          continue;
      }
    }

    const job_link = externalPath;
    const country = "Romania";
    let cities = [];
    let counties = [];

    // Simple city detection from description
    const potentialCities = [
      "Bucuresti",
      "București",
      "Cluj-Napoca",
      "Cluj",
      "Timisoara",
      "Brasov",
      "Iasi",
      "Constanta",
    ];

    for (const city of potentialCities) {
      if (description.includes(city)) {
        const { city: c, county: co } = await _counties.getCounties(city);
        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
      }
    }

    // Default to Bucharest if no city found (HQ)
    if (cities.length === 0) {
      const { city: c, county: co } = await _counties.getCounties("Bucuresti");
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "AtlasCopco";
  const logo =
    "https://www.atlascopco.com/etc.clientlibs/settings/wcm/designs/accommons/design-system/clientlib-assets/resources/icons/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
