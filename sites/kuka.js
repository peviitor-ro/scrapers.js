const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  const url =
    "https://www.kuka.com/ro-ro/api/job/getjobs?searchrootpath=DCB6206EA76F4CCFAAC81F77D8E1FFC2&q=&filters=566D20CC38E347DCB896F0D8EA6A5F0D%7C531189ACEED942FE91E7F438219858C5";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");
  const json = res.items;
  const jobs = [];

  json.forEach((item) => {
    const job = generateJob(
      item.headline,
      item.href,
      item.facetsTop[0].split(",")[0].trim()
    );
    jobs.push(job);
  });

  return jobs;
};

const getParams = () => {
  const company = "Kuka";
  const logo =
    "https://www.kuka.com/-/media/kuka-corporate/images/home/logos/kuka_logo.svg?rev=-1&hash=D89635BD83E7413E2F1D8545163A3AA1";
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
