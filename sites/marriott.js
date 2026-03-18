const { translate_city, get_jobtype } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const jobs = [];
  const url =
    "https://careers.marriott.com/api/get-jobs?radius=15&filter%5Bcountry%5D%5B0%5D=Romania&page_number=1&_pathname_=%2Fjobs&_language_=&job_source=paradox&search_mode=2&enable_kilometers=false&include_remote_jobs=true";

  // Step 1: Get the cookie
  const cookieRes = await fetch("https://careers.marriott.com/", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const cookies = cookieRes.headers.getSetCookie();
  const ctCookie = cookies.find((c) => c.startsWith("ct="));
  const cookieValue = ctCookie ? ctCookie.split(";")[0] : "";

  const myHeaders = new Headers();
  myHeaders.append("Cookie", cookieValue);
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append(
    "User-Agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  myHeaders.append("Referer", "https://careers.marriott.com/jobs");
  myHeaders.append("Origin", "https://careers.marriott.com");

  const raw = JSON.stringify({
    oeid: 1,
    disable_switch_search_mode: true,
    site_available_languages: ["en", "en-us"],
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const res = await fetch(url, requestOptions).then((response) =>
    response.json(),
  );

  const items = res.jobs;

  for (const item of items) {
    const job = item;
    const job_title = item.title;
    const job_link = "https://careers.marriott.com/" + item.originalURL;
    const location = item.locations[0].city;
    const country = item.locations[0].country;
    const city = translate_city(location);

    const { city: c, county: co } = await _counties.getCounties(city);
    const job_type = job.job_type ? job.job_type : "";
    const remote = get_jobtype(job_type);

    const job_element = generateJob(
      job_title,
      job_link,
      country,
      c,
      co,
      remote,
    );
    jobs.push(job_element);
  }
  return jobs;
};

const run = async () => {
  const company = "Marriott";
  const logo = "https://content.ejobs.ro/img/logos/3/3431.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
