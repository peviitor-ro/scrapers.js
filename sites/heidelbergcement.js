const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  city: "Romania", // HQ location but might be remote?
});


const getJobs = async () => {
  let url =
  " https://www.heidelbergmaterials.ro/ro/anunturi-de-angajare?field_job_offer_entry_level=16&field_job_offer_contract_type=13";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const total_jobs = soup.find("p", { class: "hc-title" }).text.trim().split(" ")[0];

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
    const results = soup.find("div", { class: "hc-search-list" }).findAll("div", { class: "hc-teaser__content" });
    results.forEach((job) => {
      const job_title = job.find("a", { class: "hc-link" }).text.trim();
      const job_link = "https://www.heidelbergmaterials.ro" + job.find("a").attrs.href;
      jobs.push(generateJob(job_title, job_link));
    });
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

run(); // this will be called by our main.js job

module.exports = { getJobs, getParams };