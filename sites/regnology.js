const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  let url = "https://www.regnology.net/en/careers/";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.find("ul", { class: "link-list" }).findAll("li");

  const romaniaCities = {
    Bucharest: "Bucharest",
    Sibiu: "Sibiu",
  };

  items.forEach((item) => {
    const cityElement = item.find("p");
    const city = cityElement ? cityElement.text.trim() : "";
    const county = romaniaCities[city];

    if (county) {
      const job_title = item.find("h3").text.trim();
      const job_link = "https://www.regnology.net" + item.find("a").attrs.href;
      jobs.push(generateJob(job_title, job_link, "Romania", city, county));
    }
  });
  return jobs;
};

const run = async () => {
  const company = "Regnology";
  const logo =
    "https://www.regnology.net/project/frontend/build/logo-regnology.7537d456.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
