const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

let time_to_wait = 0;

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getAditionalCity = async (url) => {
  time_to_wait++;
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const citys = res.jobPostingInfo.additionalLocations;
  const is_remote = res.jobPostingInfo.location.split("-");
  const remote =
    is_remote[is_remote.length - 1].trim().toLowerCase() === "remote"
      ? ["Remote"]
      : [];

  for (let i = 0; i < citys.length; i++) {
    const splits = citys[i].split("-");
    let city = translate_city(splits[splits.length - 1].trim().toLowerCase());
    let finded_city = "";
    let finded_county = "";

    if (city.trim().toLowerCase() === "remote") {
      finded_county = "";
      finded_city = "Romania";
    } else {
      const { foudedTown, county } = getTownAndCounty(city);
      if (county) {
        finded_county = county;
        finded_city = foudedTown;
      }
    }
    return { foudedTown: finded_city, county: finded_county, remote };
  }
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
    jobPostings.forEach((jobPosting) => {
      const { title, externalPath, locationsText } = jobPosting;
      const job_link_prefix =
        "https://crowdstrike.wd5.myworkdayjobs.com/en-US/crowdstrikecareers";
      const job_link = job_link_prefix + externalPath;
      const separatorIndex = locationsText.indexOf(" ");
      let city = translate_city(locationsText.substring(0, separatorIndex));

      let { foudedTown, county } = getTownAndCounty(city);

      const isCounty = async () => {
        if (county) {
          const res = {
            foudedTown,
            county,
            remote: [],
          };
          return res;
        } else {
          const jobName = externalPath.split("/");
          const url = `https://crowdstrike.wd5.myworkdayjobs.com/wday/cxs/crowdstrike/crowdstrikecareers/job/${
            jobName[jobName.length - 1]
          }`;
          return await getAditionalCity(url);
        }
      };

      isCounty().then((res) => {
        jobs.push(
          generateJob(title, job_link, res.foudedTown, res.county, res.remote)
        );
      });
    });
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
  setTimeout(() => {
    postApiPeViitor(jobs, getParams());
  }, time_to_wait * 200);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
