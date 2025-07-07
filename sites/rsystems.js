const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const Jssoup = require("jssoup").default;

const getJobs = async () => {
  let page = 1;
  const jobs = [];

  const requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  let data = await fetch(
    "https://eu.rsystems.com/category/careers/romania-bucharest/",
    requestOptions
  ).then((response) => response.text());

  let res = new Jssoup(data);
  let items = res.findAll("div", { class: "uael-post-wrapper" });

  while (items.length > 0) {
    for (const item of items) {
      const job_title = item.find("h3").text.trim();
      const job_link = item.find("a").attrs.href;
      const city = "Bucuresti";
      const county = "Bucuresti";

      jobs.push(generateJob(job_title, job_link, "Romania", city, county));
    }
    page += 1;
    let data = await fetch(
      `https://eu.rsystems.com/category/careers/romania-bucharest/page/${page}/`,
      requestOptions
    ).then((response) => response.text());
    res = new Jssoup(data);
    items = res.findAll("div", { class: "uael-post-wrapper" });
  }
  return jobs;
};

const run = async () => {
  const company = "RSystems";
  const logo =
    "https://eu.rsystems.com/wp-content/uploads/2021/01/R-Systems-EUROPE-Blue-new.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
