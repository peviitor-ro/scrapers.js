const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const {
  getTownAndCounty,
  removeDiacritics,
} = require("../getTownAndCounty.js");
const { replace_char, findCity } = require("../utils.js");

const generateJob = (job_title, job_link, city, county) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
});

const getJobs = async () => {
  const acurateCities = {
    "satu-mare": { foudedTown: "Satu Mare", county: "Satu Mare" },
    bihor: { foudedTown: "Oradea", county: "Bihor" },
    alba: { foudedTown: "Alba Iulia", county: "Alba" },
    cluj: { foudedTown: "Cluj-Napoca", county: "Cluj" },
  };
  const url = "https://agricover.ro/cariere";
  const scraper = new Scraper(url);

  const res = await scraper.get_soup("HTML");
  const items = res.find("div", { class: "careers-list" }).findAll("div");

  const jobs = [];
  items.forEach((item) => {
    const cities = [];

    const job_title = item.find("h3").text.trim();
    const job_link = "https://agricover.ro" + item.find("a").attrs.href;

    const senteces = replace_char(
      item.find("h5").text,
      ["(", ")", ",", ".", "/"],
      " "
    ).split(" ");

    // get acurate cities
    senteces.forEach((sentence) => {
      try {
        const { foudedTown, county } =
          acurateCities[removeDiacritics(sentence.toLowerCase())];
        cities.push(foudedTown);
        counties.push(county);
      } catch (error) {}
    });

    // get the rest of the cities
    const city = findCity(
      replace_char(
        removeDiacritics(item.find("h5").text),
        ["(", ")", ",", ".", "/"],
        " "
      )
    );

    // merge the cities
    const newCities = [...cities, ...city];

    // get the counties
    const counties = [
      ...new Set(newCities.map((c) => getTownAndCounty(c).county)),
    ];

    const job = generateJob(job_title, job_link, newCities, counties);
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
