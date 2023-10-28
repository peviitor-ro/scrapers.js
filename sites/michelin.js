const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
});

const getJobs = async () => {
  const url = "https://michelinhr.wd3.myworkdayjobs.com/wday/cxs/michelinhr/Michelin/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  
  const data = {
    appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };

  const jobs = [];

  let res = await scraper.post(data);

  const { total } = res;
  let jobPostings = res.jobPostings;

  const numberOfPages = Math.ceil(total / limit);

  for (let i = 0; i < numberOfPages; i ++) {
    jobPostings = res.jobPostings;
    jobPostings.forEach((jobPosting) => {
      const { title, externalPath, locationsText } = jobPosting;
      const job_link_prefix = "https://michelinhr.wd3.myworkdayjobs.com/en-US/Michelin";
      const job_link = job_link_prefix + externalPath;
      let citys = locationsText.split(",");
      const {foudedTown, county} = getTownAndCounty(translate_city(citys[0]));
      jobs.push(generateJob(title, job_link, foudedTown, county));
    });
    data.offset = (i + 1) * limit;
    res = await scraper.post(data);
    jobPostings = res.jobPostings;
  }

  return jobs;
};

const getParams = () => {
  const company = "Michelin";
  const logo = "https://michelinhr.wd3.myworkdayjobs.com/Michelin/assets/logo";
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