const { translate_city } = require("../utils.js");
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
  
 const citys_elements = [
   ...(res?.jobPostingInfo?.additionalLocations ?? []),
   ...(res?.jobPostingInfo?.location ? [res.jobPostingInfo.location] : []),
 ];
  let cities = [];
  let counties = [];

  const remote =
    res?.jobPostingInfo?.remoteType === "Fully Remote" ? ["Remote"] : [];

  for (const elem of citys_elements) {
    const separatorIndex = elem.indexOf("(");
    let city = elem.substring(separatorIndex + 1).replace(")", "");
    const { city: c, county: co } = await _counties.getCounties(
      translate_city(city)
    );
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }
  }

  return { cities, counties, remote };
};

const getJobs = async () => {
  const url =
    "https://dynata.wd108.myworkdayjobs.com/wday/cxs/dynata/careers/jobs";
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

    for (const jobPosting of jobPostings) {
      const { title, externalPath, locationsText } = jobPosting;

      const job_link_prefix =
        "https://dynata.wd1.myworkdayjobs.com/en-US/careers";
      const job_link = job_link_prefix + externalPath;

      const separatorIndex = locationsText.indexOf("(");
      let city = locationsText.substring(separatorIndex + 1).replace(")", "");

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city)
      );

      if (c) {
        jobs.push(generateJob(title, job_link, "Romania", c, co));
      } else {
        const jobName = externalPath.split("/")[3];
        const url = `https://dynata.wd108.myworkdayjobs.com/en-US/careers/job/${jobName}`;
        const { cities, counties, remote } = await getAditionalCity(url);

        jobs.push(
          generateJob(title, job_link, "Romania", cities, counties, remote)
        );
      }
    }

    data.offset = i * limit;
    soup = await scraper.post(data);
  }
  return jobs;
};

const run = async () => {
  const company = "Dynata";
  const logo =
    "https://www.dynata.com/wp-content/themes/dynata/images/dynata-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
