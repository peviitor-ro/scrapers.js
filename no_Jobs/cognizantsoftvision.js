  // cannot make requests because of anti bot measures
  // we need to use a headless browser to bypass this

  const {
    Scraper,
    postApiPeViitor,
    generateJob,
    getParams,
  } = require("peviitor_jsscraper");
  const { translate_city } = require("../utils.js");
  const { Counties } = require("../getTownAndCounty.js");

  const getJobs = async () => {
    const url =
      "https://careers.cognizant.com/global-en/jobs/?keyword=&location=Romania&radius=100&lat=&lng=&cname=Romania&ccode=RO&pagesize=100#results";
    const scraper = new Scraper(url);

    const res = await scraper.get_soup("HTML");
    scraper.config.headers = {
      "Cookie": ".AspNetCore.Antiforgery.xNP2COZwMoQ=CfDJ8BtJRhj16UBDs2irUj32Lvj7NzkVXLI4WpPZfQZqsvF1jVQFe8YuFT0LSF0J6uhyBUap97ou4OYyLhFMnHt9iKbZ1eczMEdOp62pS5sEEgDEYg2TuGvvVZGILdtPKY0O9Rw0oMU2EYPMcYArxzuYtMY",
    };

    const jobs = [];

    const jobs_element = res.findAll("div", { class: "card card-job" });

    for (const elem of jobs_element) {
        const job_title = elem.find("h2", { class: "card-title" }).text.trim();
        const job_link = "https://careers.cognizant.com" + elem.find("a")["href"].trim();
        const city = translate_city(elem.findAll("li")[0].text.trim().split(",")[0]);
        
        const { city: c, county: co } = await new Counties().getCounties(city);

        const job = generateJob(
          job_title,
          job_link,
          "Romania",
          c,
          co,
        );
        jobs.push(job);
    }
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

  module.exports = { run, getJobs, getParams }; // this is needed for our unit test jobs
