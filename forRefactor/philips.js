"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

async function get_aditonal_city(url) {
  const s = new scraper.ApiScraper(url);
  s.headers.headers["Content-Type"] = "application/json";
  s.headers.headers["Accept"] = "application/json";
  const soup = await s.get();
  let locations = [];

  try {
    locations = [
      ...soup.jobPostingInfo.additionalLocations,
      soup.jobPostingInfo.location,
    ];
  } catch (error) {
    locations = [soup.jobPostingInfo.location];
  }

  let location_elements = false;

  locations.map((location) => {
    const { foudedTown, county } = getTownAndCounty(
      translate_city(location.toLowerCase().trim())
    );
    if (foudedTown && county) {
      location_elements = {
        foudedTown: foudedTown,
        county: county,
      };
    }
  });

  return location_elements;
}

const url =
  "https://philips.wd3.myworkdayjobs.com/wday/cxs/philips/jobs-and-careers/jobs";

const company = { company: "Philips" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);
s.headers.headers["Content-Type"] = "application/json";
s.headers.headers["Accept"] = "application/json";

let data = {
  appliedFacets: { locationHierarchy1: ["6e1b2a934716103c2addacb847bf00cc"] },
  limit: 20,
  offset: 0,
  searchText: "",
};

s.post(data).then((response) => {
  let step = 20;
  let totalJobs = response.total;

  const range = scraper.range(0, totalJobs, step);

  const fetchData = () => {
    return new Promise((resolve) => {
      for (let step of range) {
        data["offset"] = step * 20;
        s.post(data).then((response) => {
          let jobs = response.jobPostings;
          jobs.forEach((job) => {
            finalJobs.push(job);
          });
          if (finalJobs.length === totalJobs) {
            resolve(finalJobs);
          }
        });
      }
    });
  };

  let jobs = [];

  fetchData()
    .then(async (finalJobs) => {
      await Promise.all(
        finalJobs.map(async (job) => {
          const job_title = job.title;
          const job_link =
            "https://philips.wd3.myworkdayjobs.com/en-US/jobs-and-careers" +
            job.externalPath;
          const city = job.locationsText.split(",")[0].trim();

          const { foudedTown, county } = getTownAndCounty(
            translate_city(city.toLowerCase())
          );

          const job_element = {
            job_title: job_title,
            job_link: job_link,
            company: company.company,
            country: "Romania",
          };

          if (foudedTown && county) {
            job_element.city = foudedTown;
            job_element.county = county;
          } else {
            const location = await get_aditonal_city(
              "https://philips.wd3.myworkdayjobs.com/wday/cxs/philips/jobs-and-careers" +
                job.externalPath
            );

            if (location) {
              job_element.city = location.foudedTown;
              job_element.county = location.county;
            }

            job_element.remote = ["Remote"];
          }

          jobs.push(job_element);
        })
      );
    })
    .then(() => {
      console.log(JSON.stringify(jobs, null, 2));

      scraper.postApiPeViitor(jobs, company);

      let logo =
        "https://1000logos.net/wp-content/uploads/2017/05/Phillips-Logo-500x281.png";

      let postLogo = new scraper.ApiScraper(
        "https://api.peviitor.ro/v1/logo/add/"
      );
      postLogo.headers.headers["Content-Type"] = "application/json";
      postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
    });
});
