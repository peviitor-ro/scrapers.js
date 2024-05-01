const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  city: "Sibiu",
  county: "Sibiu",
  remote: [],
});

const getJobs = async () => {
  let url =
    "https://www.regnology.net/en/careers/?city=Romania#jobs";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.find("ul", { class: "link-list" }).findAll("li");

  items.forEach((item) => {
    const job_title = item.find("h3").text.trim();
    const job_link = "https://www.regnology.net" + item.find("a").attrs.href;

    jobs.push(generateJob(job_title, job_link));
  });
  return jobs;
};

const getParams = () => {
  const company = "Regnology";
  const logo =
    "https://www.regnology.net/project/frontend/build/logo-regnology.7537d456.svg";
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

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job