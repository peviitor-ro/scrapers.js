const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const Jssoup = require("jssoup").default;
const querystring = require('querystring');

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  city: "Romania",
});

const getJobs = async () => {
  const url = "https://osf.digital/careers/jobs?location=romania";
  const scraper = new Scraper(url);
  const type = "HTML";
  const soup = await scraper.get_soup(type);
  const validationTokenWrapper = soup.find("input", {name: "__RequestVerificationToken"});
  const validationToken = validationTokenWrapper.attrs.value

  const additionalHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
  }
  scraper.config.headers = {...scraper.config.headers, ...additionalHeaders};
  const data = {
    scController: "OsfCommerceJob",
    scAction: "GetItems",
    parameter: "request",
    "__RequestVerificationToken": validationToken 
  }
  const soupPost = await scraper.post(querystring.stringify(data));
  const soupPostJS = new Jssoup(soupPost);
  const ul = soupPostJS.find("ul", {class: "list-jobs"});
  const lis = ul.findAll("li");
  const jobs = [];
  lis.forEach(li => {
    const h4 = li.find("h4");
    const job_title = h4.text;
    const domainName = "https://osf.digital";
    const a = li.find("a", {class: "blue-link"});
    const href = a.attrs.href
    const job_link = domainName + href;
    const job = generateJob(job_title, job_link);
    jobs.push(job);
  });
  return jobs;
};

const getParams = () => {
  const company = "OSFDigital";
  const logo =
    "https://osf.digital/library/media/osf/digital/common/header/osf_digital_logo.svg";
  const apikey = process.env.COSTIN;
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
  await postApiPeViitor(jobs, params);
};

run(); // this will be called by our main.js job

module.exports = { getJobs, getParams }; // this is needed for our unit test job
