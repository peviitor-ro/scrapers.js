const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
  range,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  let url = "https://careers.altenromania.ro/jds/1";
  const scraper = new Scraper(url);
  let res = await scraper.get_soup("JSON");

  const pages = JSON.parse(res.success.message).pager.pageCount;
  const items = [];
  const jobs = [];

  await Promise.all(
    range(1, pages, 1).map(async (i) => {
      url = "https://careers.altenromania.ro/jds/" + i;
      scraper.url = url;
      const res = await scraper.get_soup("JSON");
      items.push(...JSON.parse(res.success.message).recordList);
    })
  );

  await Promise.all(
    items.map(async (job) => {
      const job_title = job.titlu;
      const job_link = "https://careers.altenromania.ro/job/" + job.id;
      const city = job.locatie;
      const country = "Romania";
      const remote = [];

      const job_obj = generateJob(job_title, job_link, country);

      if (city.includes("Remote")) {
        remote.push("Remote");
        job_obj.remote = remote;
      } else {
        const { city: c, county: co } = await _counties.getCounties(translate_city(city));
        if (c) {
          job_obj.city = c;
          job_obj.county = co;
        }
      }

      jobs.push(job_obj);
    })
  );

  return jobs;
};

const run = async () => {
  const company = "Alten";
  const logo = "https://careers.altenromania.ro/assets/img/svgs/logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
// const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
// const { getTownAndCounty } = require("../getTownAndCounty.js");
// const { translate_city } = require("../utils.js");

// const generateJob = (job_title, job_link, remote, city, county) => ({
//   job_title,
//   job_link,
//   country: "Romania",
//   city,
//   county,
//   remote,
// });

// const getJobs = async () => {
//   let url = "https://careers.altenromania.ro/jds/1";
//   const jobs = [];

//   const scraper = new Scraper(url);
//   let res = await scraper.get_soup("JSON");

//   const pages = JSON.parse(res.success.message).pager.pageCount;

//   for (let i = 1; i <= pages; i++) {
//     const jobs_elements = JSON.parse(res.success.message).recordList;
//     jobs_elements.forEach((job) => {
//       const job_title = job.titlu;
//       const job_link = "https://careers.altenromania.ro/job/" + job.id;
//       const city = job.locatie;
//       const remote = [];

//       if (city.includes("Remote")) {
//         remote.push("Remote");
//         jobs.push(generateJob(job_title, job_link, remote));
//       } else {
//         const { foudedTown, county } = getTownAndCounty(
//           translate_city(city.toLowerCase())
//         );
//         jobs.push(generateJob(job_title, job_link, remote, foudedTown, county));
//       }
//     });
//     url = "https://careers.altenromania.ro/jds/" + (i + 1);
//     scraper.url = url;
//     res = await scraper.get_soup("JSON");
//   }

//   return jobs;
// };

// const getParams = () => {
//   const company = "Alten";
//   const logo = "https://careers.altenromania.ro/assets/img/svgs/logo.svg";
//   const apikey = process.env.APIKEY;
//   const params = {
//     company,
//     logo,
//     apikey,
//   };
//   return params;
// };

// const run = async () => {
//   const jobs = await getJobs();
//   const params = getParams();
//   postApiPeViitor(jobs, params);
// };

// if (require.main === module) {
//   run();
// }

// module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
