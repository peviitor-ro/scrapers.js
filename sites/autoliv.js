"use strict"
const scraper = require("../peviitor_scraper.js");
const uuid = require('uuid');

const url = "https://careerromania.autoliv.com/jobs";

const s = new scraper.Scraper(url);

let finalJobs = [];
const company = {"company":"Autoliv"};


s.soup.then((soup) => {
    const jobs = soup.findAll("li", {"class":"z-career-job-card-image"});

    jobs.forEach(job => {
        const id = uuid.v4();
        const job_title = job.find("span", {"class":"company-link-style"}).text.trim();
        const job_link = job.find("a").attrs.href;

        finalJobs.push({
            "id": id,
            "job_title": job_title,
            "job_link": job_link,
            "company": company.company,
            "city": "Romania",
            "country": "Romania"
        });
    });
}).then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
});