const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, country, city) => ({
  job_title,
  job_link,
  country,
  city,
});

const getJobs = async () => {
  const url =
    "https://wd3.myworkdaysite.com/wday/cxs/mdlz/External/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  const data = {"appliedFacets":{"locationCountry":["f2e609fe92974a55a05fc1cdc2852122"]},"limit":20,"offset":0,"searchText":""};
  let soup = await scraper.post(data);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total % limit === 0 ? total / limit : total / limit + 1
  );
  const jobs = [];
  for (let i = 0; i < numberOfPages; i += 1) {
    data.offset = i * limit;
    soup = await scraper.post(data);
    const { jobPostings } = soup;
    jobPostings.forEach((jobPosting) => {
      const { title, externalPath, locationsText } = jobPosting;
      const job_link_prefix =
        "https://wd3.myworkdaysite.com/en-US/recruiting/mdlz/External";
      const job_link = job_link_prefix + externalPath;
      const separatorIndex = locationsText.indexOf(",");
      const country = "Romania";
      const city = locationsText.substring(separatorIndex + 1);
      const job = generateJob(title, job_link, country, city);
      jobs.push(job);
    });
  }
  return jobs;
};

const getParams = () => {
  const company = "Mondelez";
  const logo =
    "https://www.mondelezinternational.com/-/media/Mondelez/Media/Asset-Library/logos/MDLZlogo.jpg";
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