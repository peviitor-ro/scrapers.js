const { translate_city, get_jobtype } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getAditionalcities = async (job_link) => {
  const scraper = new Scraper(job_link);
  const res = await scraper.get_soup("HTML");
  const items = res
    .find("dl", { class: "company-links" })
    .findAll("dd")[2]
    .text.split(",");

  let cities = [];
  let counties = [];

  await Promise.all(
    items.map(async (item) => {
      const { city: c, county: co } = await _counties.getCounties(
        translate_city(item.trim())
      );
      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }
    })
  );

  return { cities, counties };
};

const getJobs = async () => {
  const url = "https://recrutare.evolvetoday.ro/jobs?page=1";
  const jobs = [];
  let page = 1;
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.findAll("li", { class: "z-career-job-card-image" });

  while (items.length > 0) {
    await Promise.all(
      items.map(async (item) => {
        let cities = [];
        let counties = [];
        let jobtypes = [];

        const job_title = item
          .find("span", { class: "text-block-base-link" })
          .text.trim();
        const job_link = item.find("a").attrs.href;
        const spans = item.findAll("span");

        let locations = spans[3].text.split(",");

        await Promise.all(
          locations.map(async (city) => {
            const { city: c, county: co } = await _counties.getCounties(
              translate_city(city.trim())
            );
            if (c) {
              cities.push(c);
              counties = [...new Set([...counties, ...co])];
            } else {
              const { cities: c, counties: co } =
                await getAditionalcities(job_link);
              cities.push(...c);
              counties = [...new Set([...counties, ...co])];
            }
          })
        );

        spans.forEach((span) => {
          const jobtype = get_jobtype(span.text.toLowerCase());
          if (jobtype && !jobtypes.includes(jobtype)) {
            jobtypes.push(...jobtype);
          }
        });

        const job = generateJob(
          job_title,
          job_link,
          "Romania",
          cities,
          counties,
          jobtypes
        );
        jobs.push(job);
      })
    );
    page++;
    scraper.url = `https://recrutare.evolvetoday.ro/jobs?page=${page}`;
    res = await scraper.get_soup("HTML");
    items = res.findAll("li", { class: "z-career-job-card-image" });
  }
  return jobs;
};

const run = async () => {
  const company = "evolve";
  const logo = "https://evolvetoday.ro/wp-content/uploads/2019/09/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
