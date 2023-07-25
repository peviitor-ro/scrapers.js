const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city, 
});

const getJobs = async () => {
  const url = "https://corporate.pirelli.com/corporate/en-ww/careers/work-with-us?region=europe&country=romania&function=all";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const jobElements = soup.findAll('div', { 'data-country': "0c7d5ae44b2a0be9ebd7d6b9f7d60f20" });
  const jobs = [];
  jobElements.forEach((el) => {
    const job_title = el.find('span').text.trim();
    const city = el.find('span', { 'class': "loc" }).text.trim();
    const jumpTo = "#:~:text="; 
    const job_link = url + jumpTo + job_title;
    const job = generateJob(job_title, job_link, city);
    jobs.push(job);
  });
  return jobs;
};

const getParams = () => {
  const company = "Pirelli";
  const logo =
    "https://d2snyq93qb0udd.cloudfront.net/corporate/logo-pirelli2x.jpg";
  const apikey = process.env.KNOX;
  const params = {
    company,
    logo,
    apikey,
  };
  return params
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  await postApiPeViitor(jobs, params);
};

run(); // this will be called by our main.js job

module.exports = { getJobs, getParams }; // this is needed for our unit test job