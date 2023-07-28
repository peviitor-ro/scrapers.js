/* eslint-disable no-plusplus */
const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  const jobs = [];
  let scraper = new Scraper("https://drmaxromania.com/oportunitati-de-cariera/?paged=1");
  let type = "HTML";
  let soup = await scraper.get_soup(type);
  const soupElements3 = soup.findAll("a", { class: "page-numbers" });
  const pagination = [];
  soupElements3.forEach((el) => {
    const page = el.text;
    pagination.push(page);
  })
  const totalPages = Number(pagination[2]);
  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = `https://drmaxromania.com/oportunitati-de-cariera/?paged=${page}`;
     scraper = new Scraper(pageUrl);
     type = "HTML";
     soup = await scraper.get_soup(type);
     const soupElements = soup.findAll("h2", { class: "awsm-job-post-title" });
     const soupElements2 = soup.findAll("div", { class: "awsm-job-specification-job-location" });
   
     for (let i = 0; i < soupElements.length; i++) {
       soupElements[i].append(soupElements2[i]);
     }
     soupElements.forEach((el) => {
       const job_title = el.find("a").text;
       const job_link = el.find("a").attrs.href;
       const city = el.find("span").text.trim();
       const job = generateJob(job_title, job_link, city);
       jobs.push(job);
     });
 
  }
  return jobs;
};

const getParams = () => {
  const company = "drmax";
  const logo = "https://drmaxromania.com/wp-content/uploads/2023/03/drmaxromania-logo-768x136.png";
  const apikey = process.env.KNOX;
  const params = {
    company,
    logo,
    apikey,
  };
  return params
};

const run = async () => {
  const jobss = await getJobs();
  const params = getParams();
  await postApiPeViitor(jobss, params);
};

if (require.main === module) {
  run();
}

module.exports = {getJobs, getParams }; // this is needed for our unit test job




