const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://cariere.agricover.ro/go/Toate-posturile-disponibile/9022302/?_gl=1*1vu7559*_gcl_au*NTkxODAxOTIwLjE3MzMyMjQwODk.";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");
  const items = res.findAll("li", { class: "job-tile" });

  const jobs = [];

  for (const item of items) {
    let cities = [];
    let counties = [];
    const job_title = item.find("a").text.trim();
    const job_link = "https://cariere.agricover.ro" + item.find("a").attrs.href;
    const country = "Romania";
    const locations = item.find("div", {class:"location"}).find("div").text.split(",");

    for (let i = 0; i < locations.length; i++) {
      let c = locations[i];
      const replacedChars = ["(", ")", ",", ".", "/", "Oras:", "Regiunea", "-"];
      replacedChars.forEach((char) => {
        c = c.replace(char, "");
      });

      if (c !== "") {
        const { city, county } = await _counties.getCounties(c);
        
        if (city) {
          cities.push(
            city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
          );
          counties = [...new Set([...counties, ...county])];
        }
      }
    }

    const job = generateJob(job_title, job_link, country, cities, counties);
    jobs.push(job);
  }

  return jobs;
};

const run = async () => {
  const company = "Agricover";
  const logo =
    "https://agricover.ro/Files/Images/AgricoverCorporate/logo/svg/logo-positive.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
