const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
});

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const citys = res.jobPostingInfo.additionalLocations;
  for (let i = 0; i < citys.length; i++) {
    let city = citys[i];
    if (city === "Bucharest") {
      city = "Bucuresti";
    }
    const county = getTownAndCounty(city).county;

    if (county) {
      return county;
    }
  }
};

const getJobs = async () => {
  const url = "https://nxp.wd3.myworkdayjobs.com/wday/cxs/nxp/careers/jobs";
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
      const job_link_prefix = "https://nxp.wd3.myworkdayjobs.com/en-US/careers";
      const job_link = job_link_prefix + externalPath;
      const separatorIndex = locationsText.indexOf(",");
      let city = locationsText.substring(separatorIndex + 1);

      if (city === "Bucharest") {
        city = "Bucuresti";
      }

      let county = getTownAndCounty(city).county;

      const isCounty = async () => {
        if (county) {
          return county;
        } else {
          const jobName = externalPath.split("/")[3];
          const url = `https://nxp.wd3.myworkdayjobs.com/wday/cxs/nxp/careers/job/${jobName}`;
          return await getAditionalCity(url);
        }
      };

      isCounty().then((county) => {
        const job = generateJob(title, job_link, city, county);
        jobs.push(job);
      });
    });
  }

  return jobs;
};

const getParams = () => {
  const company = "NXP";
  const logo = "https://nxp.wd3.myworkdayjobs.com/careers/assets/logo";
  // const apikey = process.env.APIKEY;
  const apikey = "182b157-bb68-e3c5-5146-5f27dcd7a4c8"
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
