const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://agricover.ro/cariere";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");
  const items = res.find("div", { class: "careers-list" }).findAll("div");

  const jobs = [];

  await Promise.all(
    items.map(async (item) => {
      let cities = [];
      let counties = [];
      const job_title = item.find("h3").text.trim();
      const job_link = "https://agricover.ro" + item.find("a").attrs.href;
      const country = "Romania";
      const locations = item.find("h5").text.split(" ");

      const locationPromises = locations.map(async (c) => {
        const replacedChars = [
          "(",
          ")",
          ",",
          ".",
          "/",
          "Oras:",
          "Regiunea",
          "-",
        ];
        replacedChars.forEach((char) => {
          c = c.replace(char, "");
        });

        if (c !== "") {
          const { city, county } = await _counties.getCounties(c);
          if (city) {
            cities.push(city);
            counties = [...new Set([...counties, ...county])];
          }
        }
      });

      await Promise.all(locationPromises);

      const job = generateJob(job_title, job_link, country, cities, counties);
      jobs.push(job);
    })
  );

  return jobs;
};

const run = async () => {
  const company = "Agricover";
  const logo =
    "https://agricover.ro/Files/Images/AgricoverCorporate/logo/svg/logo-positive.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo, "laurentiumarianbaluta@gmail.com");
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
