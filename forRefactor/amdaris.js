"use strict"
const scraper = require("../peviitor_scraper.js");
const uuid = require('uuid');

const url = "https://amdaris.com/jobs/";

const s = new scraper.Scraper(url);

const locations = ["bucharest", "timisoara", "romania"];

let finalJobs = [];
const company = {"company":"Amdaris"};

s.soup.then((soup) => {
    let jobs = soup.find('table', {"id":"jobs-data-table"}).find("tbody").findAll("tr");
    for (let job of jobs) {
        
        const location = job.find("td", {"class":"country-role"}).text.trim();
        if (locations.includes(location)) {
            const id = uuid.v4();
            const job_title = job.find("a").text.trim();
            const job_link = job.find("a").attrs.href;
            const city = location;

            finalJobs.push({
                "id": id,
                "job_title": job_title,
                "job_link": job_link,
                "company": company.company,
                "city": city,
                "country": "Romania"
            });
        };
    };
}).then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
});




