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
  const remote = res.jobPostingInfo.remoteType === "Fully Remote" ? ["Remote"] : [];

  for (let city of citys_elements) {
    const { foudedTown, county } = getTownAndCounty(
      translate_city(city.split("(")[1].replace(")", "").trim().toLowerCase())
    );

    if (foudedTown && county) {
      citys.push(foudedTown);
      countys.push(county);
    }
  }

  return { citys, countys, remote };
};

const generateJob = (job_title, job_link, city, county, remote = []) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  const url =
    "https://dynata.wd1.myworkdayjobs.com/wday/cxs/dynata/careers/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const limit = 20;

  const data = {
    appliedFacets: {
      locations: [
        "67cdbb242c0f01186560ab7ce9361603",
        "67cdbb242c0f01ff4f8eac7ce9361d03",
      ],
    },
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
    const { jobPostings } = soup;

    await Promise.all(
      jobPostings.map(async (jobPosting) => {
        const { title, externalPath, locationsText } = jobPosting;

        const job_link_prefix =
          "https://dynata.wd1.myworkdayjobs.com/en-US/careers";
        const job_link = job_link_prefix + externalPath;

        const separatorIndex = locationsText.indexOf("(");
        let city = locationsText.substring(separatorIndex + 1).replace(")", "");

        const { foudedTown, county } = getTownAndCounty(
          translate_city(city.trim().toLowerCase())
        );

        if (foudedTown && county) {
          jobs.push(generateJob(title, job_link, foudedTown, county));
        } else {
          const jobName = externalPath.split("/")[3];
          const url = `https://dynata.wd1.myworkdayjobs.com/wday/cxs/dynata/careers/job/${jobName}`;
          const { citys, countys, remote } = await getAditionalCity(url);

          jobs.push(generateJob(title, job_link, citys, countys, remote));
        }
      })
    );
    data.offset = i * limit;
    soup = await scraper.post(data);
  }

  return jobs;
};

const getParams = () => {
  const company = "Dynata";
  const logo =
    "https://www.dynata.com/wp-content/themes/dynata/images/dynata-logo.png";
  const apikey = process.env.KNOX;
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
