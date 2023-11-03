const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, country, city) => ({
  job_title,
  job_link,
  country,
  city,
});

const getJobs = async () => {
  const url =
    "https://www.atlascopco.com/content/cl-ma-sp/ro-ro/jobs/job-overview/jcr:content/par/jobs_overview_copy.jobs.json?keyword=Romania";
  const scraper = new Scraper(url);
  const type = "JSON";
  const res = await scraper.get_soup(type);
  const json = res.jobs;
  const jobs = [];
  json.forEach((item) => {
    jobs.push(
      generateJob(
        item.Title,
        "https://www.atlascopco.com" + item.path,
        item.LegEntCountry,
        item.Cities
      )
    );
  });
  return jobs;
};

const getParams = () => {
  const company = "AtlasCopco";
  const logo =
    "https://www.atlascopco.com/etc.clientlibs/settings/wcm/designs/accommons/design-system/clientlib-assets/resources/icons/logo.svg";
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
