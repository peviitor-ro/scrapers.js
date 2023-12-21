const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city } = require("../utils.js");

const generateJob = (job_title, job_link, country, city, county, remote) => ({
  job_title,
  job_link,
  country,
  city,
  county,
  remote,
});

const getJobs = async () => {
  const url = "https://www.pentalog.com/api/jobs";
  const scraper = new Scraper(url);
  const additionalHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

  const data = {
    action: "search_jobs",
    index_name: "jobs",
    "prefacets[0][field]": "locations",
    "prefacets[0][limit]": 20,
    "prefacets[1][field]": "technologies",
    "prefacets[1][limit]": 2000,
    "facets[0][field]": "profile_names",
    "facets[0][limit]": 30,
    "facets[1][field]": "is_remote",
    "facets[1][limit]": 10,
    search: "*",
    ga: "GA1.2.2108953595.1689706726d",
    limit: 100,
    "filters[locations][relation]": "or",
    "filters[locations][values][0]": "Iasi, Romania",
    "filters[locations][values][1]": "Craiova, Romania",
    "filters[locations][values][2]": "Timișoara, Romania",
    "filters[locations][values][3]": "Cluj-Napoca, Romania",
    "filters[locations][values][4]": "Bucharest, Romania",
    "filters[locations][values][5]": "Brasov, Romania",
  };

  const res = await scraper.post(data);
  const jobs_objects = res.data.data;

  const jobs = [];

  jobs_objects.forEach((job) => {
    const job_title = job.title;
    const job_link = "https://www.pentalog.com/jobs/" + job.slug;
    const country = "Romania";
    const citys_obj = job.locations;

    const citys = [];
    const countys = [];
    const remote = job.is_remote ? ["Remote"] : [];

    citys_obj.forEach((city_obj) => {
      const city_Name = city_obj.split(",")[0].trim();
      const { foudedTown, county } = getTownAndCounty(
        translate_city(city_Name.toLowerCase())
      );

      if (county && foudedTown) {
        citys.push(foudedTown);
        countys.push(county);
      }
    });

    if (citys.length > 0 && countys.length > 0) {
      jobs.push(
        generateJob(job_title, job_link, country, citys, countys, remote)
      );
    } else if (remote.length > 0) {
      jobs.push(generateJob(job_title, job_link, country, [], [], remote));
    }
  });

  return jobs;
};

const getParams = () => {
  const company = "Pentalog";
  const logo =
    "https://private-user-images.githubusercontent.com/116546445/289375396-ca49d044-bb58-43e5-b0fc-bf512b8dd5da.JPG?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTEiLCJleHAiOjE3MDMxNzM4ODgsIm5iZiI6MTcwMzE3MzU4OCwicGF0aCI6Ii8xMTY1NDY0NDUvMjg5Mzc1Mzk2LWNhNDlkMDQ0LWJiNTgtNDNlNS1iMGZjLWJmNTEyYjhkZDVkYS5KUEc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMxMjIxJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMTIyMVQxNTQ2MjhaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iY2M4YTA1MWMzNGE3MTI0YjE4YWUzMzk0YzMxOWQyODkzMGEyY2Y5ZGNmOTVkNTkyMWNkYjkyNWM0Y2RlNWRhJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.lFioRwvs35chmvGanfRSVBktk5b2oEELqPPurrUYPrk";
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
