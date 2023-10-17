const { Scraper, postApiPeViitor, range } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const get_job_type = async (url) => {
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("HtML");

  const job_type_elem = res
    .find("div", { class: "job" })
    .findAll("span", { class: "rtltextaligneligible" })[2]
    .text.trim();
  const job_type = job_type_elem.includes("Remote") ? ["Remote"] : [];

  return job_type;
};

const getJobs = async () => {
  let url = "https://careers.ey.com/ey/search/?q=Romania&startrow=0";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");

  const step = 25;
  const total_jobs = parseInt(
    res.find("span", { class: "paginationLabel" }).findAll("b")[1].text
  );
  const rows = range(0, total_jobs, step);

  for (let i = 0; i < rows.length; i++) {
    const jobsElements = res
      .find("table", { class: "searchResults" })
      .find("tbody")
      .findAll("tr");

    jobsElements.forEach((job) => {
      const job_title = job.find("a").text;
      const job_link = "https://careers.ey.com" + job.find("a").attrs.href;
      const { foudedTown, county } = getTownAndCounty(
        translate_city(
          job
            .find("span", { class: "jobLocation" })
            .text.split(",")[0]
            .toLowerCase()
            .trim()
        )
      );
      const job_type = async () => await get_job_type(job_link);

      job_type().then((res) => {
        if (foudedTown && county) {
          jobs.push(generateJob(job_title, job_link, foudedTown, county, res));
        } else {
          let city = job
            .find("span", { class: "jobLocation" })
            .text.split(",")[0]
            .trim();
          jobs.push(generateJob(job_title, job_link, city, "", res));
        }
      });
    });

    url = "https://careers.ey.com/ey/search/?q=Romania&startrow=" + rows[i + 1];
    scraper.url = url;
    res = await scraper.get_soup("HTML");
  }

  return jobs;
};

const getParams = () => {
  const company = "EY";
  const logo =
    "https://rmkcdn.successfactors.com/bcfdbc8a/688bb7d2-e818-494b-967e-0.png";
  const apikey = "process.env.APIKEY";
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs().then((res) => {
    return res;
  });

  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
