const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link) => ({
  job_title,
  job_link,
  country: "Romania",
  city: "Bucuresti",
  county: "Bucuresti",
  remote: [],
});

const getJobs = async () => {
  const url = "https://www.bandainamcoent.ro/ro/careers/";
  const scraper = new Scraper(url);
  const jobs = [];
  const res = await scraper.get_soup("HTML");
  const elements = res.findAll("p", { class: "career_job_links" });

  elements.forEach((element) => {
    const job_title = element.find("a").text.trim();
    const job_link =
      "https://www.bandainamcoent.ro" + element.find("a").attrs.href;
    jobs.push(generateJob(job_title, job_link, "Romania", "Romania", []));
  });
  return jobs;
};

const getParams = () => {
  const company = "bandainamco";
  const logo =
    "https://www.bandainamcoent.ro/wp-content/themes/namco/img/logo_small.jpg";
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
