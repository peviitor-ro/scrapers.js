const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const querystring = require('querystring');

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  const url =
    "https://tss-yonder.com/wp-admin/admin-ajax.php";
  const scraper = new Scraper(url);
  let post_data = {
    'p':1,
    'action':'filter_jobs',
    'nonce':'a95427d712',
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
    "https://tss-yonder.com/wp-content/themes/Yonder-1.4/images/yonder-logo.svg";
  const apikey = "123";
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
