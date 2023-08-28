const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const https = require("https");

const urls = {
  Australia: "https://ortec.com/api/pages/en/careers/our-locations/australia",
  Denmark: "https://ortec.com/api/pages/en/careers/our-locations/denmark",
  Greece: "https://ortec.com/api/pages/en/careers/our-locations/greece",
  Romania: "https://ortec.com/api/pages/en/careers/our-locations/romania",
  Belgium: "https://ortec.com/api/pages/en/careers/our-locations/belgium",
  "United States":
    "https://ortec.com/api/pages/en/careers/our-locations/united-states",
  France: "https://ortec.com/api/pages/en/careers/our-locations/france",
  Italy: "https://ortec.com/api/pages/en/careers/our-locations/italy",
  Netherlands:
    "https://ortec.com/api/pages/en/careers/our-locations/netherlands",
  Brazil: "https://ortec.com/api/pages/en/careers/our-locations/brazil",
  Germany: "https://ortec.com/api/pages/en/careers/our-locations/germany",
  Poland: "https://ortec.com/api/pages/en/careers/our-locations/poland",
  "United Kingdom":
    "https://ortec.com/api/pages/en/careers/our-locations/united-kingdom",
};

const generateJob = (job_title, job_link, country, city) => ({
  job_title,
  job_link,
  country,
  city,
});

const getJobs = async () => {
  const jobs = [];
  for (const [key, value] of Object.entries(urls)) {
    const scraper = new Scraper(value);
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    scraper.config.httpsAgent = httpsAgent;
    const json = await scraper.get_soup("JSON");
    const items = json.sections[4].jobs;

    if (items) {
      items.forEach((job) => {
        const job_obj = generateJob(job.title, job.jobURL, key, job.subtitle);
        jobs.push(job_obj);
      });
    }
  }
  return jobs;
};

const getParams = () => {
  const company = "Ortec";
  const logo =
    "https://media.academictransfer.com/LT8OEP2nAexUPaM9-WfgcP488FM=/fit-in/490x162/filters:upscale():fill(white)/logos/ortec-en-wide.jpg";
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
