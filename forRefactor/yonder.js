const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const querystring = require("querystring");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
});

const get_nonce = async (url) => {
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const res = await scraper.get_soup((type = "HTML"));
  const nonce = res.text.match(/"nonce":"(.*?)"/)[1];
  return nonce;
};

const getJobs = async () => {
  const url = "https://tss-yonder.com/wp-admin/admin-ajax.php";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const nonce = await get_nonce("https://tss-yonder.com/job");

  let post_data = {
    p: 1,
    action: "filter_jobs",
    nonce: nonce,
  };

  const res = await scraper.post(querystring.stringify(post_data));
  const pages = res.pages;

  const jobs = [];
  for (let i = 1; i <= pages; i++) {
    post_data.p = i;
    const res = await scraper.post(querystring.stringify(post_data));
    const jobs_objects = res.jobs;

    jobs_objects.forEach((job) => {
      const { foudedTown, county } = getTownAndCounty(
        translate_city(job.location.trim().toLowerCase())
      );

      const job_title = job.title;
      const job_link = job.url;
      const obj = generateJob(job_title, job_link, foudedTown, county);
      jobs.push(obj);
    });
  }

  return jobs;
};

const getParams = () => {
  const company = "Yonder";
  const logo =
    "https://tss-yonder.com/wp-content/themes/yonder/assets/images/logo.svg";
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
