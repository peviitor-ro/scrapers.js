
const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link, country, city, county, remote) => ({
  job_title,
  job_link,
  country,
  city,
  county,
  remote,
});

const getJobs = async () => {
  let url =
    "https://jobs.halliburton.com/search/?createNewAlert=false&q=&locationsearch=Romania";
  const jobs = [];
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let pages = Math.ceil(
    parseInt(
      res.find("span", { class: "paginationLabel" }).findAll("b")[1].text
    ) / 25
  );
  let items = res.find("tbody").findAll("tr");
  let isJobs = res.find("div", { id: "attention" });

  if (isJobs) {
    return [];
  }

  for (let i = 0; i < pages; i++) {
    items.forEach((item) => {
      const isRo = item
        .find("span", { class: "jobLocation" })
        .text.split(",")[2]
        .trim();

      if (isRo.toLowerCase() === "ro") {
        const job_title = item.find("a").text.trim();
        const job_link =
          "https://jobs.halliburton.com" + item.find("a").attrs.href;

        let city = item
          .find("span", { class: "jobLocation" })
          .text.split(",")[0]
          .trim();
        if (city.includes("Bucharest")) {
          city = "Bucuresti";
        }
        const { foudedTown, county } = getTownAndCounty(city);
        const remote = [];

        jobs.push(
          generateJob(
            job_title,
            job_link,
            "Romania",
            foudedTown,
            county,
            remote
          )
        );
      }
    });
  }

  return jobs;
};

const getParams = () => {
  const company = "Halliburton";
  const logo =
    "https://rmkcdn.successfactors.com/6fdd2711/8ba9d1d9-30b6-4c01-b093-b.svg";
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
