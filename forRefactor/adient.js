const { Scraper, postApiPeViitor, generateJob, getParams } = require("peviitor_jsscraper");

const getJobs = async () => {
  const url =
    " https://adient.wd3.myworkdayjobs.com/wday/cxs/adient/External/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };
  const limit = 20;
  const data = {
    appliedFacets: { Location_Country: ["f2e609fe92974a55a05fc1cdc2852122"] },
    limit,
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
      const job_link_prefix =
        "https://adient.wd3.myworkdayjobs.com/en-US/External";
      const job_link = job_link_prefix + externalPath;
      const separatorIndex = locationsText.indexOf(",");
      const country = locationsText.substring(0, separatorIndex);
      const city = locationsText.substring(separatorIndex + 1);
      const job = generateJob(title, job_link, country, city);
      jobs.push(job);
    });
  }
  return jobs;
};

const run = async () => {
    const company = "Adient";
  const logo =
    "https://www.adient.com/wp-content/uploads/2021/09/Adient_Logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo, "laurentiumarianbaluta@gmail.com");
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
