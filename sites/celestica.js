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
  let url =
    "https://careers.celestica.com/search/?createNewAlert=false&q=&locationsearch=Romania&startrow=0";
  const jobs = [];

  try {
    const scraper = new Scraper(url);
    let res;
    try {
      res = await scraper.get_soup("HTML");
    } catch (e) {
      try {
        res = await scraper.render_page();
      } catch (e2) {
        console.log(
          "Could not fetch jobs from Celestica, returning empty array",
        );
        return jobs;
      }
    }

    if (!res) {
      return jobs;
    }

    const paginationLabel = res.find("span", { class: "paginationLabel" });
    if (!paginationLabel) {
      return jobs;
    }

    const totalJobs = parseInt(paginationLabel.findAll("b")[1].text);

    if (totalJobs === 0) {
      return jobs;
    }

    const pages = range(0, totalJobs, 25);

    const fetchData = async () => {
      let jobs = [];

      for (const page of pages) {
        const url = `https://careers.celestica.com/search/?createNewAlert=false&q=&locationsearch=Romania&startrow=${page}`;
        const s = new Scraper(url);
        let res;
        try {
          res = await s.get_soup("HTML");
        } catch (e) {
          try {
            res = await s.render_page();
          } catch (e2) {
            console.log(`Failed to fetch page ${page}, skipping`);
            continue;
          }
        }

        if (!res) continue;

        const tbody = res.find("tbody");
        if (!tbody) continue;

        const results = tbody.findAll("tr");
        results.forEach((job) => {
          jobs.push(job);
        });
      }

      return jobs;
    };

    const jobsData = await fetchData();

    for (const elem of jobsData) {
      const job_title = elem.find("a").text.trim();
      const job_link =
        "https://careers.celestica.com" + elem.find("a").attrs.href;
      const city = elem
        .find("span", { class: "jobLocation" })
        .text.split(",")[0]
        .trim();

      let cities = [];
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city),
      );

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", cities, counties);
      jobs.push(job);
    }
  } catch (error) {
    console.log("Error fetching jobs:", error.message);
  }

  return jobs;
};

const run = async () => {
  const company = "Celestica";
  const logo =
    "https://rmkcdn.successfactors.com/bcf7807a/f4737f7e-31d4-4348-963c-8.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);

  if (jobs.length > 0) {
    postApiPeViitor(jobs, params);
  } else {
    console.log(`Joblist for ${company} is empty. Skipping API post.`);
  }
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
