const { translate_city, get_jobtype } = require("../utils.js");
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
  let page = 1;
  while (true) {
    const url = `https://careers.marriott.com/en-gb/jobs?location_name=Romania&location_type=4&page_number=${page}&filter%5Bcountry%5D%5B0%5D=Romania`;
    const scraper = new Scraper(url);

    const soup = await scraper.get_soup("HTML");

    const items = soup.findAll("li", { class: "results-list__item" });

    for (const item of items) {
      const job = item;
      const job_title = job
        .find("a", { class: "results-list__item-title" })
        .text.trim();
      const job_link = "https://careers.marriott.com/" + job.find("a", { class: "results-list__item-title" }).attrs.href;
      const location = job.find("span", { class: "results-list__item-street--label" }).text.trim().split(", ");
      const country = location[location.length - 1];
      const city = translate_city(
        location[1].split(" ")[0]
      );

      const { city: c, county: co } = await _counties.getCounties(city);
      const job_type = job.job_type ? job.job_type : "";
      const remote = get_jobtype(job_type);

      const job_element = generateJob(
        job_title,
        job_link,
        country,
        c,
        co,
        remote
      );
      jobs.push(job_element);
    }
    if (items.length === 0) break;
    page++;
  }
  return jobs;
};

const run = async () => {
  const company = "Marriott";
  const logo = "https://content.ejobs.ro/img/logos/3/3431.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
