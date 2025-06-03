const { translate_city, replace_char } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://cariere.brinks.ro/";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res
    .find("div", {
      class: "swiper-wrapper",
    })
    .findAll("div", {
      class: "product",
    });
  let index = 0;

  for (const item of items) {
    const job_title = item.find("h3").text.trim();

    const job_link = url + `#${index}`;
    let cities = [];
    let counties = [];

    const sentence = item
      .findAll("p")
      [item.findAll("p").length - 1].text.trim()
      .replace("Locatii: ", "")
      .trim()
      .split(",");

    for (const location of sentence) {
      const city = translate_city(replace_char(location.trim()));
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    }

    jobs.push(generateJob(job_title, job_link, "Romania", cities, counties));
    index++;
  }
  return jobs;
};

const run = async () => {
  const company = "Brinks";
  const logo =
    "https://ro.brinks.com/o/brinks-website-theme/images/logos/brinks/brinks-logo-blue.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
