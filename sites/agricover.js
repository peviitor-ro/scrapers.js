const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getCitiesAndCounties = async (locations) => {
  let cities = [];
  let counties = [];

  for (let i = 0; i < locations.length; i++) {
    let c = locations[i];
    const replacedChars = ["(", ")", ",", ".", "/", "Oras:", "Regiunea", "-"];
    replacedChars.forEach((char) => {
      c = c.replace(char, "");
    });

    if (c !== "") {
      const { city, county } = await _counties.getCounties(c);

      if (city) {
        cities.push(city.charAt(0).toUpperCase() + city.slice(1).toLowerCase());
        counties = [...new Set([...counties, ...county])];
      }
    }
  }

  return { cities, counties };
};

const getJobsFromMainSite = async () => {
  const sitemapScraper = new Scraper("https://agricover.ro/sitemap.xml");
  const sitemap = await sitemapScraper.get_soup("HTML");

  const jobLinks = sitemap
    .findAll("loc")
    .map((loc) => loc.text.trim())
    .filter(
      (link) =>
        link.includes("/cariere/") && !link.includes("/programul-")
    );

  const jobs = [];

  for (const job_link of jobLinks) {
    const page = await new Scraper(job_link).get_soup("HTML");
    const wrapper = page.find("div", { class: "career-wrapper" });

    if (!wrapper) {
      continue;
    }

    const titleElement = wrapper.find("h2");
    const job_title = (
      wrapper.attrs["data-career"] ||
      (titleElement && titleElement.text) ||
      ""
    ).trim();

    if (!job_title) {
      continue;
    }

    const details = wrapper.find("div", { class: "career-details" });
    const detailValues = details ? details.findAll("h3") : [];
    const location = detailValues.length
      ? detailValues[detailValues.length - 1].text.trim()
      : "";
    const locations = location ? location.split(",") : [];
    const { cities, counties } = await getCitiesAndCounties(locations);

    jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
  }

  return jobs;
};

const getJobs = async () => {
  const url =
    "https://cariere.agricover.ro/go/Toate-posturile-disponibile/9022302/?_gl=1*1vu7559*_gcl_au*NTkxODAxOTIwLjE3MzMyMjQwODk.";
  const scraper = new Scraper(url);

  let res;
  try {
    res = await scraper.get_soup("HTML");
  } catch (error) {
    console.error("Falling back to agricover.ro job pages");
    return getJobsFromMainSite();
  }

  const items = res.findAll("li", { class: "job-tile" });

  const jobs = [];

  for (const item of items) {
    const job_title = item.find("a").text.trim();
    const job_link = "https://cariere.agricover.ro" + item.find("a").attrs.href;
    const country = "Romania";
    const locations = item.find("div", {class:"location"}).find("div").text.split(",");
    const { cities, counties } = await getCitiesAndCounties(locations);

    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "Agricover";
  const logo =
    "https://agricover.ro/Files/Images/AgricoverCorporate/logo/svg/logo-positive.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
