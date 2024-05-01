// TODO: Add city and county to the apple jobs
const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  let jobs = [];
  const url = "https://jobs.apple.com/ro-ro/search?location=romania-ROMC";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HTML");

  const noresults = res.find("div", { id: "no-search-results" });
  if (noresults) return jobs;

  const items = res.find("table", { id: "tblResultSet" }).findAll("tbody");

  items.forEach((job) => {
    jobs.push(
      generateJob(
        job.find("a").text.trim(),
        "https://jobs.apple.com" + job.find("a").attrs.href,
        job.find("td", { class: "table-col-2" }).text.trim()
      )
    );
  });

  return jobs;
};

const getParams = () => {
  const company = "apple";
  const logo = "https://www.apple.com/apple-touch-icon.png";
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
