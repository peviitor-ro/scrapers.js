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
  const jobs = [];
  let scraper = new Scraper(
    "https://drmaxromania.com/oportunitati-de-cariera/?paged=1"
  );
  let type = "HTML";
  let soup = await scraper.get_soup(type);
  const soupElements3 = soup.findAll("a", { class: "page-numbers" });
  const pagination = [];
  soupElements3.forEach((el) => {
    const page = el.text;
    pagination.push(page);
  });
  const totalPages = Number(pagination[2]);
  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = `https://drmaxromania.com/oportunitati-de-cariera/?paged=${page}`;
    scraper = new Scraper(pageUrl);
    type = "HTML";
    soup = await scraper.get_soup(type);
    const soupElements = soup.findAll("h2", { class: "awsm-job-post-title" });
    const soupElements2 = soup.findAll("div", {
      class: "awsm-job-specification-job-location",
    });

    for (let i = 0; i < soupElements.length; i++) {
      soupElements[i].append(soupElements2[i]);
    }

    await Promise.all(
      soupElements.map(async (el) => {
        const job_title = el.find("a").text;
        const job_link = el.find("a").attrs.href;
        let cities_elements = el.findAll("span", {
          class: "awsm-job-specification-term",
        });

        let cities = [];
        let counties = [];

        await Promise.all(
          cities_elements.map(async (city) => {
            const city_element = city.text;
            const { city: c, county: co } = await _counties.getCounties(
              translate_city(city_element)
            );
            if (c) {
              cities.push(c);
              counties = [...new Set([...counties, ...co])];
            }
          })
        );

        const job = generateJob(
          job_title,
          job_link,
          "Romania",
          cities,
          counties
        );
        jobs.push(job);
      })
    );
  }
  console.log(jobs);
  return jobs;
};

const run = async () => {
  const company = "drmax";
  const logo =
    "https://drmaxromania.com/wp-content/uploads/2023/03/drmaxromania-logo-768x136.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
