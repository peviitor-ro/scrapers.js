/* eslint-disable object-shorthand */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */
const scraper = require("../peviitor_scraper.js");

const company = { company: "Ortec" };
const finalJobs = [];
const apiKey = process.env.KNOX
const url = 'https://ortec.com/api/career'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  }
})
  .then(response => response.json())
  .then(responseData => {

    const filteredArray = responseData
      .filter(obj => obj.country === 'Romania')
      .map(({ title, jobId }) => ({ title, jobId }));

    filteredArray.forEach(obj => {
      const jobTitle = obj.title;
      const jobid = obj.jobId;
      finalJobs.push({
        job_title: jobTitle,
        job_link: `https://ortec.com/en/careers/find-jobs/career/jobs?id=${jobid}`,
        company: company.company,
        city: 'Bucuresti',
        country: "Romania",
      });
    });
  }).then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company, apiKey);

    const logo = "https://media.academictransfer.com/LT8OEP2nAexUPaM9-WfgcP488FM=/fit-in/490x162/filters:upscale():fill(white)/logos/ortec-en-wide.jpg";

    const postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");

    postLogo.headers.headers["Content-Type"] = "application/json";

    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });