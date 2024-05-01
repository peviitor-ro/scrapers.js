const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link,country, city, county, remote) => ({
  job_title,
  job_link,
  country,
  city,
  county,
  remote,
});

const getJobs = async () => {
  const url =
    "https://jobs.marriott.com/api/jobs?location=Romania&page=1&limit=100";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup('JSON');
  const items = soup.jobs;
  const jobs = [];
  
  items.forEach((item) => {
    const job = item.data
    const job_title = job.title;
    const job_link = job.meta_data.canonical_url;
    const country = job.country;
    let city = job.city;
    if (city.includes("Bucharest")) {
      city = "Bucuresti";
    }
    const { foudedTown, county } = getTownAndCounty(city);
    let remote = job.employment_type;
    if (remote.includes("Remote") || remote.includes("Hybrid")) {
      remote = remote.includes("Remote") ? "Remote" : "Hybrid";
    }else {
      remote = [];
    }
    jobs.push(generateJob(job_title, job_link, country, foudedTown, county, remote));
  });
  return jobs;
};

const getParams = () => {
  const company = "Marriott";
  const logo =
    "https://content.ejobs.ro/img/logos/3/3431.jpg";
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
