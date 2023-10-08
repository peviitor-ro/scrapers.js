const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  const url = "https://agricover.ro/cariere";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");
  const items = res.find("div", { class: "careers-list" }).findAll("div");

  const jobs = [];
  items.forEach((item) => {
    let city = [];
    const job_title = item.find("h3").text.trim();
    const job_link =  "https://agricover.ro" + item.find("a").attrs.href;
    const citys = item.find("h5").text.split(" ")
    citys.forEach((c) => {
      const replacedChars = ["(", ")", ",", "."];
      replacedChars.forEach((char) => {
        c = c.replace(char, "");
      });
      if (getTownAndCounty(c).foudedTown) {
        city.push(getTownAndCounty(c).foudedTown);
      }
    });
    const job = generateJob(job_title, job_link, city);
    jobs.push(job);
  });

  return jobs;
};

const getParams = () => {
  const company = "Agricover";
  const logo =
    "https://agricover.ro/Files/Images/AgricoverCorporate/logo/svg/logo-positive.svg";
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