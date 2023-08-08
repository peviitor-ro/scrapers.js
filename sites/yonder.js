const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const querystring = require('querystring');

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const get_nonce = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup(type = "HTML");
  const nonce = res.text.match(/nonce":"(.*?)"/)[1];
  return nonce;
};


const getJobs = async () => {
  const url =
    "https://tss-yonder.com/wp-admin/admin-ajax.php";
  const scraper = new Scraper(url);
  const nonce = await get_nonce("https://tss-yonder.com/job");

  let post_data = {
    'p':1,
    'action':'filter_jobs',
    'nonce':nonce,
  };

  const res = await scraper.post(querystring.stringify(post_data));
  const pages = res.pages;

  const jobs = [];
  for (let i = 1; i <= pages; i++) {
    post_data.p = i;
    const res = await scraper.post(querystring.stringify(post_data));
    const jobs_objects = res.jobs;

    jobs_objects.forEach((job) => {
      const job_title = job.title;
      const job_link = job.url;
      const city = job.location;
      const obj = generateJob(job_title, job_link, city);
      jobs.push(obj);
    });
  };

  return jobs;
};

const getParams = () => {
  const company = "Yonder";
  const logo =
    "https://tss-yonder.com/wp-content/uploads/2023/07/50018998_1183391155144101_1830536179909394432_n.png";
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
