const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { translate_city } = require("../utils.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city: city,
  county: county,
});

async function get_aditonal_city(url) {
  const s = new Scraper(url);
  const soup = await s.get_soup("HTML");
  const locations = soup.find("p", { class: "hc-text" }).findAll("strong");
  const cities = [];
  const counties = [];

  locations.forEach((location) => {
    let city = translate_city(location.text.split(",")[0]);
    let { foudedTown, county } = getTownAndCounty(city);

    if (foudedTown && county) {
      cities.push(foudedTown);
      counties.push(county);
    }
  });

  return { cities, counties };
}

get_aditonal_city(
  "https://www.heidelbergmaterials.ro/ro/responsabil-investitii"
);

const getJobs = async () => {
  let url =
    " https://www.heidelbergmaterials.ro/ro/anunturi-de-angajare?field_job_offer_entry_level=16&field_job_offer_contract_type=13";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const total_jobs = soup
    .find("p", { class: "hc-title" })
    .text.trim()
    .split(" ")[0];

  let pattern = /"block_config_key=(.*)","view_base_path"/;
  const body = soup.find("body").prettify();
  const block_config_key = body.match(pattern)[1];

  const step = 10;
  const numberPages = Math.ceil(total_jobs / step);
  let jobs = [];
  for (let i = 0; i < numberPages; i++) {
    const url = `https://www.heidelbergmaterials.ro/ro/anunturi-de-angajare?field_job_offer_entry_level=16&field_job_offer_contract_type=13&block_config_key=${block_config_key}&page=${i}`;
    const s = new Scraper(url);
    const soup = await s.get_soup(type);
    const results = soup
      .find("div", { class: "hc-search-list" })
      .findAll("div", { class: "hc-teaser__content" });
    const some = results.map(async (job) => {
      const job_title = job.find("a", { class: "hc-link" }).text.trim();
      const job_link =
        "https://www.heidelbergmaterials.ro" + job.find("a").attrs.href;
      const locations = job.find("ul").findAll("li")[2].text.split(" ");
      const city = translate_city(locations[locations.length - 1]);

      let { foudedTown, county } = getTownAndCounty(city);

      if (!county) {
        await get_aditonal_city(job_link).then(({ cities, counties }) => {
          jobs.push(generateJob(job_title, job_link, cities, counties));
        });
      } else {
        jobs.push(generateJob(job_title, job_link, foudedTown, county));
      }
    });
    await Promise.all(some);
  }
  return jobs;
};

const getParams = () => {
  const company = "HeidelbergCement";
  const logo =
    "https://www.heidelbergmaterials.ro/sites/default/files/logo/HeidelbergMaterials.svg";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
