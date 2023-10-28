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

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const citys = res.jobPostingInfo.additionalLocations;
  for (let i = 0; i < citys.length; i++) {
    const city = citys[i].split(",")[0];

    const { foudedTown, county } = getTownAndCounty(translate_city(city));

    if (foudedTown && county) {
      return { foudedTown, county };
    }
  }
};

const getJobs = async () => {
  const url =
    "https://plexus.wd5.myworkdayjobs.com/wday/cxs/plexus/Plexus_Careers/jobs";
  const scraper = new Scraper(url);

  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const limit = 20;
  const data = {
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText: "Romania",
  };

  let soup = await scraper.post(data);

  const { total } = soup;

  const numberOfPages = Math.ceil(total / limit);

  const jobs = [];

  for (let i = 0; i < numberOfPages; i += 1) {
    const { jobPostings } = soup;
    jobPostings.forEach(async (jobPosting) => {
      const { title, externalPath, locationsText } = jobPosting;
      const job_link_prefix =
        "https://plexus.wd5.myworkdayjobs.com/en-US/Plexus_Careers";
      const job_link = job_link_prefix + externalPath;
      const { foudedTown, county } = getTownAndCounty(
        translate_city(locationsText.split(",")[0])
      );

      if (foudedTown && county) {
        jobs.push(generateJob(title, job_link, foudedTown, county));
      } else {
        const { foudedTown, county } = await getAditionalCity(
          "https://plexus.wd5.myworkdayjobs.com/wday/cxs/plexus/Plexus_Careers" +
            externalPath
        );
        jobs.push(generateJob(title, job_link, foudedTown, county));
      }
    });

    data.offset = (i + 1) * limit;
    soup = await scraper.post(data);
  }

  return jobs;
};

const getParams = () => {
  const company = "Plexus";
  const logo =
    "https://www.plexus.com/PlexusCDN/plexus/media/english-media/logos/Plexus-Logo-212x42.svg";
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
