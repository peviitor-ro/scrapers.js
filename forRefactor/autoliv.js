const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { findCity, get_jobtype } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  const acurateCities = {
    sfantu: {
      county: "Covasna",
      city: "Sfantu Gheorghe",
    },
  };

  const excludeCities = ["Spring"];

  let url =
    "https://careerromania.autoliv.com/jobs/show_more?layout=card-image&page=1&section_color_preset=primary";
  const jobs = [];
  let page = 1;

  const scraper = new Scraper(url);
  const additionalHeaders = {
    Accept: "text/vnd.turbo-stream.html, text/html, application/xhtml+xml",
    "Sec-Fetch-Site": "same-origin",
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
  };

  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  let res = await scraper.get_soup("HTML");

  let elements = res.findAll("li");

  while (elements.length > 0) {
    elements.forEach((item) => {
      const jobsElements = item.findAll("span");
      const job_title = jobsElements[0].text.trim();
      const job_link = item.find("a").attrs.href;

      const sentence = jobsElements[3].text.trim();

      const cities = [
        ...findCity(sentence).filter((city) => !excludeCities.includes(city)),
      ];
      const counties = [...cities.map((city) => getTownAndCounty(city).county)];

      sentence.split(" ").forEach((word) => {
        try {
          const city = acurateCities[word.toLowerCase()].city;
          cities.push(city);
          counties.push(acurateCities[word.toLowerCase()].county);
        } catch (error) {}
      });

      let remote = [];
      try {
        const remoteElement = jobsElements[5].text.trim();
        remote = get_jobtype(remoteElement);
      } catch (error) {}
      jobs.push(generateJob(job_title, job_link, cities, counties, remote));
    });

    page++;
    url = `https://careerromania.autoliv.com/jobs/show_more?layout=card-image&page=${page}&section_color_preset=primary`;
    scraper.url = url;
    res = await scraper.get_soup("HTML");
    elements = res.findAll("li");
  }

  return jobs;
};

const getParams = () => {
  const company = "Autoliv";
  const logo =
    "https://images.teamtailor-cdn.com/images/s3/teamtailor-production/logotype-v3/image_uploads/d7b6d876-3ad3-4051-81a2-e6293d1694ec/original.png";
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
