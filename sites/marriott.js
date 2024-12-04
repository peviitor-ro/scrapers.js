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
  let page = 1;
  while (true) {
    const url = `https://careers.marriott.com/api/get-jobs?filter%5Bcountry%5D%5B0%5D=Romania&page_number=${page}&_pathname_=%2Fjobs`;
    const myHeaders = new Headers();
    myHeaders.append(
      "Cookie",
      "s_sq=marriottglobal%252C%3D%2526c.%2526a.%2526activitymap.%2526page%253Dcareers.marriott.com%25252Fjobs%2526link%253D2%2526region%253Dhome%2526pageIDType%253D1%2526.activitymap%2526.a%2526.c; s_tbm=true; _ga_5KF17TW5S6=GS1.1.1733308750.1.1.1733308828.0.0.0; _ga_EZ2PXT09WR=GS1.1.1733308750.1.1.1733308828.0.0.0; _ga_WN7X9F92J3=GS1.1.1733308753.1.1.1733308828.0.0.0; _ga=GA1.1.1349323740.1733308751; s_cc=true; OptanonConsent=isGpcEnabled=0&datestamp=Wed+Dec+04+2024+12%3A39%3A58+GMT%2B0200+(Eastern+European+Standard+Time)&version=202401.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=1%3A1%2C3%3A1%2C4%3A1%2C6%3A1&geolocation=RO%3BAG&AwaitingReconsent=false; ct=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NDljODk3OS03ZjQxLTQxNGYtYTQ2Mi0wYWUzMjA3ODk5MGYiLCJpYXQiOjE3MzMzMDg3OTcsImV4cCI6MTczMzQ4MTU5N30.1gkgxn3I3gBkw430E-XT5zaoAijMXuHqMUz6ouaybqA; OptanonAlertBoxClosed=2024-12-04T10:39:13.509Z; AMCVS_664516D751E565010A490D4C%40AdobeOrg=1; AMCV_664516D751E565010A490D4C%40AdobeOrg=-1712354808%7CMCIDTS%7C20062%7CMCMID%7C32279196725718569064040137324556608975%7CMCAAMLH-1733913551%7C6%7CMCAAMB-1733913551%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1733315951s%7CNONE%7CvVersion%7C4.3.0; s_campaign=Unpaid%20Referrals%3A%20Typed%2FBookmarked"
    );
    myHeaders.append("Content-Type", "text/plain");

    const raw = '{"oeid":1,"disable_switch_search_mode":true}';

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const res = await fetch(url, requestOptions).then((response) =>
      response.json()
    );

    const items = res.jobs;

    for (const item of items) {
      const job = item;
      const job_title = job.title;
      const job_link = "https://careers.marriott.com/" + job.originalURL;
      const country = job.locations[0].country;
      const city = translate_city(job.locations[0].city);

      const { city: c, county: co } = await _counties.getCounties(city);
      const job_type = job.job_type ? job.job_type : "";
      const remote = get_jobtype(job_type);

      const job_element = generateJob(
        job_title,
        job_link,
        country,
        c,
        co,
        remote
      );
      jobs.push(job_element);
    }
    if (items.length === 0) break;
    page++;
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
