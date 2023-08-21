const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");

const generateJob = (job_title, job_link, city) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
});

const getJobs = async () => {
  const url =
    "https://www.ejobs.ro/company/marriott/3431";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup('HTML');
  const items = soup.find("main", { class: "CDInner__Main" }).findAll("li", { class: "JobCardWrapper" });
  const jobs = [];
  items.forEach((item) => {
    const job = generateJob(
        item.find("h2", { class: "JCContentMiddle__Title" }).text.trim(),
        'https://www.ejobs.ro' + 
        item.find("h2", { class: "JCContentMiddle__Title" }).find("a").attrs.href,
        item.find("span", { class: "JCContentMiddle__Info" }).text.trim()
    );
    jobs.push(job);
  });
  return jobs;
};

const getParams = () => {
  const company = "Marriott";
  const logo =
    "https://content.ejobs.ro/img/logos/3/3431.jpg";
  const apikey = "process.env.APIKEY";
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
