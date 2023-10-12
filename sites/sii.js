const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const generateJob = (
  job_title,
  job_link,
  city = "Bucuresti",
  county = "Bucuresti",
  remote
) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  let url = "https://www.siiromania.ro/jobopportunities/#section";
  const jobs = [];
  let pages = 1;
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.find("tbody").findAll("tr");

  while (items.length > 0) {
    items.forEach((item) => {
      const citys = [];
      const countys = [];
      const jobtypes = [];

      const job_title = item.findAll("td")[0].text.trim();
      const job_link = item.findAll("td")[0].find("a").attrs.href;

      const isCity = item.findAll("td")[2].text.split("-");
      if (isCity[isCity.length - 1] === "Bucharest") {
        isCity[isCity.length - 1] = "Bucuresti";
      }

      if (getTownAndCounty(isCity[isCity.length - 1].trim()).foudedTown) {
        citys.push(
          getTownAndCounty(isCity[isCity.length - 1].trim()).foudedTown
        );
        countys.push(getTownAndCounty(isCity[isCity.length - 1].trim()).county);
      }

      isCity.forEach((item) => {
        if (item.includes("Remote") || item.includes("Hybrid")) {
          jobtypes.push(item.includes("Remote") ? "Remote" : "Hybrid");
        }
      });

      jobs.push(
        generateJob(job_title, job_link, citys[0], countys[0], jobtypes)
      );
    });

    pages++;
    url = `https://www.siiromania.ro/jobopportunities/page/${pages}/#section`;
    scraper.url = url;
    res = await scraper.get_soup("HTML");
    try {
      items = res.find("tbody").findAll("tr");
    } catch (e) {
      items = [];
    }
  }

  return jobs;
};

const getParams = () => {
  const company = "SII";
  const logo =
    "https://www.siiromania.ro/wp-content/themes/corporate-sii-romania/img/logo.png";
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
