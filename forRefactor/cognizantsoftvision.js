const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
  const url =
    "https://www.cognizantsoftvision.com/job-search/?location=romania";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");

  const jobs = [];

  const json = JSON.parse(
    res.find("script", { type: "application/json" }).text
  );

  json.props.pageProps.jobOpenings.jobs.forEach((elem) => {
    if (elem.location == "Romania") {
      const job_title = elem.title;
      const job_link = "https://www.cognizantsoftvision.com" + elem.link;
      const cities = [
        "Baia Mare",
        "Bucuresti",
        "Cluj-Napoca",
        "Iasi",
        "Timisoara",
      ];
      const counties = ["Maramures", "Bucuresti", "Cluj", "Iasi", "Timis"];
      const remote = ["Remote", "Hybrid"];

      const job = generateJob(
        job_title,
        job_link,
        "Romania",
        cities,
        counties,
        remote
      );
      jobs.push(job);
    }
  });
  return jobs;
};

const run = async () => {
  const company = "CognizantSoftvision";
  const logo =
    "https://www.cognizantsoftvision.com/react-images/logos/logo-header.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job

