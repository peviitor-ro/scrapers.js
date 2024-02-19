const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  county: ["Maramures", "București", "Cluj", "Iași", "Timiș"],
  city: ["Baia Mare", "București", "Cluj-Napoca", "Iași", "Timișoara"],
});

const getJobs = async () => {
  const url =
    "https://www.cognizantsoftvision.com/job-search/?location=romania";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");

  const jobs = [];

  const json = JSON.parse(
    res.find("script", { type: "application/json" }).text
  );

  json.props.pageProps.jobOpenings.jobs.forEach((job) => {
    if (job.location == "Romania") {
      const job_title = job.title;
      const job_link = "https://www.cognizantsoftvision.com" + job.link;
      jobs.push(generateJob(job_title, job_link));
    }
  });

  return jobs;
};

const getParams = () => {
  const company = "CognizantSoftvision";
  const logo =
    "https://www.cognizantsoftvision.com/react-images/logos/logo-header.png";
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
