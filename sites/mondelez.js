const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const getAditionalCity = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");

  const citys_elements = [
    ...res.jobPostingInfo.additionalLocations,
    res.jobPostingInfo.location,
  ];
  const citys = [];
  const countys = [];

  for (let city of citys_elements) {
    const { foudedTown, county } = getTownAndCounty(
      translate_city(
        city
          .split(",")[0]
          .replace("Business Office - ", "")
          .trim()
          .toLowerCase()
      )
    );

    if (foudedTown && county) {
      citys.push(foudedTown);
      countys.push(county);
    }
  }

  return { citys, countys };
};

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
});

const getJobs = async () => {
  const url = "https://wd3.myworkdaysite.com/wday/cxs/mdlz/External/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  const data = {
    appliedFacets: { locationCountry: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit: 20,
    offset: 0,
    searchText: "",
  };
  let soup = await scraper.post(data);
  const { total } = soup;
  const numberOfPages = Math.floor(
    total / limit + (total % limit === 0 ? 0 : 1)
  );

  const jobs = [];
  for (let i = 0; i < numberOfPages; i ++ ) {
    const { jobPostings } = soup;
    await Promise.all(
      jobPostings.map(async (jobPosting) => {
        const { title, externalPath, locationsText } = jobPosting;
        const job_link_prefix =
          "https://wd3.myworkdaysite.com/en-US/recruiting/mdlz/External";
        const job_link = job_link_prefix + externalPath;
        const city = locationsText.split(",")[0];

        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.toLowerCase())
        );

        if (foudedTown && county) {
          jobs.push(generateJob(title, job_link, foudedTown, county));
        } else {
          const jobName = externalPath.split("/")[3];
          const url = `https://wd3.myworkdaysite.com/wday/cxs/mdlz/External/job/${jobName}`;
          const { citys, countys } = await getAditionalCity(url);

          jobs.push(generateJob(title, job_link, citys, countys));
        }
      })
    );

    data.offset = i + 1 * limit;
    soup = await scraper.post(data);
  }
  return jobs;
};

const getParams = () => {
  const company = "Mondelez";
  const logo =
    "https://wd3.myworkdaysite.com/recruiting/mdlz/External/assets/logo";
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
