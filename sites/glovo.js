const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const axios = require("axios");
const querystring = require("querystring");
const Jssoup = require("jssoup").default;

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://careers.glovoapp.com/wp-admin/admin-ajax.php";
  const jobs = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = querystring.stringify({
      action: "glovo_filter_jobs",
      page: page,
      "countries[]": "Romania",
    });

    try {
      const response = await axios.post(url, data, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      if (response.data && response.data.success && response.data.data.html) {
        const soup = new Jssoup(response.data.data.html);
        const jobCards = soup.findAll("div", "career-card");

        if (jobCards.length === 0) {
          hasMore = false;
          break;
        }

        for (const card of jobCards) {
          const titleElem = card.find("h4", "job-title");
          const linkElem = card.find("div", "apply-job-btn").find("a");
          const locationElem = card
            .find("ul", "job-address")
            .find("li")
            .find("span");

          if (titleElem && linkElem && locationElem) {
            const job_title = titleElem.text.trim();
            const job_link = linkElem.attrs.href;
            const locationText = locationElem.text.trim(); // "Bucharest, Romania"

            const cities = [];
            let counties = [];

            // Extract city
            const cityRaw = locationText.split(",")[0].trim();
            const city = translate_city(cityRaw);

            const { city: c, county: co } = await _counties.getCounties(city);

            if (c) {
              cities.push(c);
              counties = [...new Set([...counties, ...co])];
            }

            const job_element = generateJob(
              job_title,
              job_link,
              "Romania",
              cities,
              counties,
            );

            jobs.push(job_element);
          }
        }
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching jobs: ${error.message}`);
      hasMore = false;
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Glovo";
  const logo =
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/317px-Glovo_logo.svg.png?20220725155704";
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
