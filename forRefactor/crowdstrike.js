const { translate_city, get_jobtype } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const cities = res.jobPostingInfo.additionalLocations;
  const remote = get_jobtype(res.jobPostingInfo.location.toLowerCase());

  if (cities) {
    for (let i = 0; i < cities.length; i++) {
      const splits = cities[i].split("-");
      let city = translate_city(splits[splits.length - 1].trim());
      const { city: c, county: co } = await _counties.getCounties(city);
      if (c) {
        return {
          city: c,
          county: co,
          remote,
        };
      }
    }
  }
  return { city: "", county: "", remote };
};

const getJobs = async () => {
  const url =
    "https://crowdstrike.wd5.myworkdayjobs.com/wday/cxs/crowdstrike/crowdstrikecareers/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  let data = {
    appliedFacets: { locations: ["27086a67c26901049dcca1f33f01ac08"] },
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
  for (let i = 0; i < numberOfPages; i++) {
    data.offset = i * limit;
    soup = await scraper.post(data);
    const { jobPostings } = soup;

    await Promise.all(
      jobPostings.map(async (jobPosting) => {
        const { title, externalPath, locationsText } = jobPosting;
        const job_link_prefix =
          "https://crowdstrike.wd5.myworkdayjobs.com/en-US/crowdstrikecareers";
        const job_link = job_link_prefix + externalPath;
        const remote = get_jobtype(locationsText.toLowerCase());
        const separatorIndex = locationsText.indexOf(" ");
        const location = translate_city(
          locationsText.substring(0, separatorIndex)
        );

        const job = generateJob(title, job_link, "Romania", "", "", remote);
        const { city, county } = await _counties.getCounties(location);

        if (city && county) {
          job.city = city ? [city] : [];
          job.county = county ? [county] : [];
        } else {
          const jobName = externalPath.split("/");
          const url = `https://crowdstrike.wd5.myworkdayjobs.com/wday/cxs/crowdstrike/crowdstrikecareers/job/${
            jobName[jobName.length - 1]
          }`;
          const { city, county, remote } = await getAditionalCity(url);
          job.city = city;
          job.county = county;
          job.remote = remote;
        }
        jobs.push(job);
      })
    );
  }
  return jobs;
};

const run = async () => {
  const company = "CrowdStrike";
  const logo =
    "https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers/assets/logo";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
