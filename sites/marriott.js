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

  const myHeaders = new Headers();
  myHeaders.append(
    "Cookie",
    '_ga_EZ2PXT09WR=GS1.3.1745325991.2.1.1745327205.0.0.0; s_tbm=true; s_sq=marriottglobal%252C%3D%2526c.%2526a.%2526activitymap.%2526page%253Dcareers.marriott.com%25252Fjobs%2526link%253DCountry%25252FRegion%2526region%253Dhome%2526pageIDType%253D1%2526.activitymap%2526.a%2526.c; _ga_5KF17TW5S6=GS1.1.1745325991.2.1.1745327071.0.0.0; _ga_WN7X9F92J3=GS1.1.1745325991.2.1.1745327071.0.0.0; RT="z=1&dm=careers.marriott.com&si=06548bfe-5c8f-4918-b49e-73e168cd7990&ss=m9si15el&sl=1&tt=3f6&rl=1&nu=246jaf9w&cl=n4as"; _ga=GA1.1.1978711166.1744817531; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Apr+22+2025+16%3A02%3A54+GMT%2B0300+(Eastern+European+Summer+Time)&version=202411.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=1c2f6113-a2d6-4a50-a423-46d08ccc665a&interactionCount=1&isAnonUser=1&landingPath=NotLandingPage&groups=1%3A1%2C3%3A1%2C4%3A1%2C6%3A1&intType=1&geolocation=RO%3BAG&AwaitingReconsent=false; _ga=GA1.3.1978711166.1744817531; s_cc=true; ct=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDgzOThlYi03Mzk0LTQwZmEtYWUyZS1hMGIyZDQyMDdjYzciLCJpYXQiOjE3NDUzMjY5NzAsImV4cCI6MTc0NTQ5OTc3MH0.VRoKn9MTBuKphqA1ElsgAxOpDlsOzjVyilQYvy0MN1w; AMCV_664516D751E565010A490D4C%40AdobeOrg=-1712354808%7CMCIDTS%7C20201%7CMCMID%7C32279196725718569064040137324556608975%7CMCAAMLH-1745930792%7C6%7CMCAAMB-1745930793%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1745333193s%7CNONE%7CvVersion%7C4.3.0; AKA_A2=A'
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
      remote
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
