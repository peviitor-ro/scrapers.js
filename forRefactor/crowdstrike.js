const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city, get_jobtype } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const cities = res.jobPostingInfo.additionalLocations;
  const remote = get_jobtype(res.jobPostingInfo.location.toLowerCase());

  if (cities) {
    for (let i = 0; i < cities.length; i++) {
      const splits = cities[i].split("-");
      let city = translate_city(splits[splits.length - 1].trim().toLowerCase());
      const { foudedTown, county } = getTownAndCounty(city);
      return {
        foudedTown: foudedTown ? foudedTown : "",
        county: county ? county : "",
        remote: remote,
      };
    }
  }
  return { foudedTown: "", county: "", remote };
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
        const city = translate_city(locationsText.substring(0, separatorIndex));

        const job = generateJob(title, job_link, "", "", remote);
        const { foudedTown, county } = getTownAndCounty(city);

        if (foudedTown && county) {
          job.city = foudedTown;
          job.county = county;
        } else {
          const jobName = externalPath.split("/");
          const url = `https://crowdstrike.wd5.myworkdayjobs.com/wday/cxs/crowdstrike/crowdstrikecareers/job/${
            jobName[jobName.length - 1]
          }`;
          const { foudedTown, county, remote } = await getAditionalCity(url);
          job.city = foudedTown;
          job.county = county;
          job.remote = remote;
        }
        jobs.push(job);
      })
    );
  }
  return jobs;
};

const getParams = () => {
  const company = "CrowdStrike";
  const logo =
    "https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers/assets/logo";
  const apikey = "process.env.APIKEY";
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
