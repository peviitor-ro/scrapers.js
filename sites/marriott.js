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
    '_ga=GA1.3.861303416.1749543138; _ga_EZ2PXT09WR=GS2.3.s1749543138$o1$g1$t1749543153$j45$l0$h0; _ga=GA1.1.861303416.1749543138; _ga_5KF17TW5S6=GS2.1.s1749543137$o1$g1$t1749543153$j44$l0$h0; s_cc=true; s_tbm=true; RT="z=1&dm=careers.marriott.com&si=ac6af54f-a444-4427-af63-74d49b1f816a&ss=mbq8t8au&sl=1&tt=1bp&rl=1"; _ga_WN7X9F92J3=GS2.1.s1749543140$o1$g0$t1749543152$j48$l0$h0; ct=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZWE5YWE5NC1hMzI5LTQ4YWYtYTZkMS01ZGQ3YTdmMmIzMTYiLCJpYXQiOjE3NDk1NDMxNTIsImV4cCI6MTc0OTcxNTk1Mn0.oEOZMe48YYtNgoEvnnv7mm5iZzEZGaspxmyy_g-NIjE; s_campaign=Natural%20Search%3A%20Google; OptanonAlertBoxClosed=2025-06-10T08:12:21.048Z; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Jun+10+2025+11%3A12%3A21+GMT%2B0300+(Eastern+European+Summer+Time)&version=202411.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=a919a064-463a-4247-83a0-53721b14c4ab&interactionCount=1&isAnonUser=1&landingPath=NotLandingPage&groups=1%3A1%2C3%3A1%2C4%3A1%2C6%3A1&intType=1; AMCVS_664516D751E565010A490D4C%40AdobeOrg=1; AMCV_664516D751E565010A490D4C%40AdobeOrg=-1712354808%7CMCIDTS%7C20250%7CMCMID%7C32279196725718569064040137324556608975%7CMCAAMLH-1750147938%7C6%7CMCAAMB-1750147938%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1749550338s%7CNONE%7CvVersion%7C4.3.0; s_tbm1=true; AKA_A2=A; lang=en-us'
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
