const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, country, county, city) => ({
  job_title,
  job_link,
  country,
  county,
  city,
  remote: [],
});

const getJobs = async () => {
  const url = "https://www.conarg.co/ro/cariere/oportunitati-de-cariera.html";
  const scraper = new Scraper(url);
  const jobs = [];
  const soup = await scraper.get_soup("HTML");

  const jobsElements = soup
    .find("article", { class: "wk-content" })
    .findAll("li");

  jobsElements.forEach((job) => {
    const job_title = job.find("h2").text.trim();
    const job_link = "https://www.conarg.co" + job.find("a").attrs.href;
    const country = "Romania";
    const county = "Bucuresti";
    const city = "Bucuresti";

    jobs.push(generateJob(job_title, job_link, country, county, city));
  });

  return jobs;
};

const getParams = () => {
  const company = "Conarg";
  const logo = "http://www.conarg.co/images/logo/logo.svg";
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
