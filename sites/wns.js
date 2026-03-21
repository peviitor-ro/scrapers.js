const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL =
  "https://careers.smartrecruiters.com/WNSGlobalServices144?search=romania";

const getLocations = async (locationText) => {
  const cityLabel = locationText
    .split(",")[0]
    .trim()
    .replace("Bucharest Bucuresti", "Bucuresti");
  const normalizedCity = translate_city(cityLabel);
  const { city, county } = await _counties.getCounties(normalizedCity);

  return {
    cities: city ? [city] : [normalizedCity],
    counties: county || [],
  };
};

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const jobs = [];
  const sections =
    soup.find("div", { class: "js-openings-load" })?.findAll("section") || [];

  for (const section of sections) {
    const locationTitle = section
      .findAll("h3")
      .find((node) =>
        (node.attrs?.class || "").includes(
          "opening-title title display--inline-block text--default",
        ),
      )
      ?.text.trim();

    if (!locationTitle) {
      continue;
    }

    const { cities, counties } = await getLocations(locationTitle);
    const jobsElements = section
      .findAll("li")
      .filter((node) => (node.attrs?.class || "").includes("opening-job"));

    for (const job of jobsElements) {
      const linkNode = job
        .findAll("a")
        .find((node) =>
          (node.attrs?.class || "").includes("link--block details"),
        );
      const titleNode = job
        .findAll("h4")
        .find((node) =>
          (node.attrs?.class || "").includes(
            "details-title job-title link--block-target",
          ),
        );
      const description =
        job
          .findAll("p")
          .find((node) =>
            (node.attrs?.class || "").includes("details-desc job-desc"),
          )
          ?.text.trim() || "";

      if (!linkNode || !titleNode) {
        continue;
      }

      const remote = [];
      if (description.includes("Remote")) {
        remote.push("remote");
      }
      if (description.includes("Hybrid")) {
        remote.push("hybrid");
      }

      jobs.push(
        generateJob(
          titleNode.text.trim(),
          linkNode.attrs.href,
          "Romania",
          cities,
          counties,
          remote,
        ),
      );
    }
  }

  return jobs;
};

const run = async () => {
  const company = "WNS";
  const logo =
    "https://www.wnscareers.com/Portals/0/logo.png?ver=2020-02-03-150252-400";
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
