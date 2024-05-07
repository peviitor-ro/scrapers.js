const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

const getJobs = async () => {
    const url = "https://brightantity.com/engineering-product-development-rd/";
    const url2 = "https://brightantity.com/it-software-development/";
    const jobs = [];
    const scraper = new Scraper(url);
    const scraper2 = new Scraper(url2);
    const type = "HTML";
    const res = await scraper.get_soup(type);
    const res2 = await scraper2.get_soup(type);
    const elements = res.findAll("h2", { class: "eael-entry-title" });
    const elements2 = res2.findAll("h2", { class: "eael-entry-title" });
    
    const jobsList = [...elements, ...elements2];
    
    jobsList.forEach((item) => {
        const job_title = item.find("a").text.trim();
        const job_link = item.find("a").attrs.href;
        const job = generateJob(job_title, job_link, "Romania");
        jobs.push(job);
    });

    return jobs;
};

const run = async () => {
    const company = "brightantity";
    const logo =
      "https://i0.wp.com/brightantity.com/wp-content/uploads/2020/08/1123Asset-2-1.png?resize=768%2C265&ssl=1";
    const jobs = await getJobs();
    const params = getParams(company, logo);
    postApiPeViitor(jobs, params);
}

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
