const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link, city, county, jobtype) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  jobtype,
});

const getAditionalCitys = async (job_link) => {
  const scraper = new Scraper(job_link);
  const res = await scraper.get_soup("HTML");
  const items = res
    .find("dl", { class: "company-links" })
    .findAll("dd")[2]
    .text.split(",");
  const citys = [];
  const countys = [];

  items.forEach((item) => {
    if (item.includes("Bucharest")) {
      item = "Bucuresti";
    }

    if (getTownAndCounty(item.trim()).foudedTown) {
      citys.push(getTownAndCounty(item.trim()).foudedTown);
      countys.push(getTownAndCounty(item.trim()).county);
    }
  });

  return { citys, countys };
};

const getJobs = async () => {
  const url = "https://recrutare.evolvetoday.ro/jobs";
  const jobs = [];
  let page = 1;
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.findAll("li", { class: "z-career-job-card-image" });

  while (items.length > 0) {
    items.forEach((item) => {
      let citys = [];
      let countys = [];
      let jobtypes = [];

      const job_title = item
        .find("span", { class: "text-block-base-link" })
        .text.trim();
      const job_link = item.find("a").attrs.href;
      const spans = item.findAll("span");

      let city = spans[3].text.split(",");
      city.forEach((c) => {
        if (c.includes("Bucharest")) {
          c = "Bucuresti";
        }

        if (getTownAndCounty(c.trim()).foudedTown) {
          citys.push(getTownAndCounty(c.trim()).foudedTown);
          countys.push(getTownAndCounty(c.trim()).county);
        } else if (c.trim() === "Multiple locations") {
          getAditionalCitys(job_link).then((res) => {
            citys = res.citys;
            countys = res.countys;
          });
        } else {
          citys.push("Bucuresti");
          countys.push("Bucuresti");
        }
      });

      spans.forEach((span) => {
        if (span.text.includes("Remote")) {
          jobtypes.push("Remote");
        } else if (span.text.includes("Hybrid")) {
          jobtypes.push("Hybrid");
        }
      });

      setTimeout(() => {
        const job = generateJob(job_title, job_link, citys, countys, jobtypes);
        jobs.push(job);
      }, 1000);
    });
    page++;
    scraper.url = `https://recrutare.evolvetoday.ro/jobs?page=${page}`;
    res = await scraper.get_soup("HTML");
    items = res.findAll("li", { class: "z-career-job-card-image" });
  }

  return jobs;
};

const getParams = () => {
  const company = "evolve";
  const logo =
    "https://evolvetoday.ro/wp-content/uploads/2019/09/logo.svg";
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
  
  setTimeout(() => {
    const params = getParams();
  postApiPeViitor(jobs, params);
  }, 1000);
};

if (require.main === module) {
    run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job

