const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobBatch = async (url) => {
  const jobs = [];
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const soupElements = soup.findAll("h2", { class: "awsm-job-post-title" });
  const soupElements2 = soup.findAll("div", {
    class: "awsm-job-specification-job-location",
  });

  for (let i = 0; i < soupElements.length; i += 1) {
    soupElements[i].append(soupElements2[i]);
  }
  soupElements.forEach((el) => {
    const job_title = el.find("a").text;
    const job_link = el.find("a").attrs.href;
    const city = el.find("span").text.trim();
    const job = generateJob(job_title, job_link, city);
    jobs.push(job);
  });
  return jobs;
};

const getJobs = async () => {
  const allJobs = [];
  const firstPageUrl =
    "https://drmaxromania.com/oportunitati-de-cariera/?paged=1";
  const scraper = new Scraper(firstPageUrl);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const soupElements3 = soup.findAll("a", { class: "page-numbers" });
  const pagination = [];
  soupElements3.forEach((el) => {
    const page = el.text;
    pagination.push(page);
  });
  const totalPages = Number(pagination[2]);
  for (let page = 1; page <= totalPages; page += 1) {
    const pageUrl = `https://drmaxromania.com/oportunitati-de-cariera/?paged=${page}`;
    const pageJobs = await getJobBatch(pageUrl);
    allJobs.push(...pageJobs);
  }
  return allJobs;
};

const getParams = () => {
  const company = "Dr.Max";
  const logo =
    "https://drmaxromania.com/wp-content/uploads/2023/03/drmaxromania-logo-768x136.png";
  const apikey = process.env.KNOX;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const allJobs = await getJobs();
  const params = getParams();
  await postApiPeViitor(allJobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
