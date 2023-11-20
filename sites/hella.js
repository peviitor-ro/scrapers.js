"use strict";
fetch("https://hella.csod.com/ux/ats/careersite/3/home?c=hella&country=ro")
  .then((response) => response.text())
  .then((data) => {
    const scraper = require("../peviitor_scraper.js");
    const apiKey = process.env.KNOX
    const url = 'https://uk.api.csod.com/rec-job-search/external/jobs'  
    const requestBody = {"careerSiteId":3,"careerSitePageId":3,"pageNumber":1,"pageSize":200,"cultureId":1,"searchText":"","cultureName":"en-US","states":[],"countryCodes":["ro"],"cities":[],"placeID":"ChIJw3aJlSb_sUARlLEEqJJP74Q","radius":null,"postingsWithinDays":null,"customFieldCheckboxKeys":[],"customFieldDropdowns":[],"customFieldRadios":[]}
    const company = { company: "hella" };
    const finalJobs = [];
    const pattern = /csod.context={.*?}}};/g;
    const context = data.match(pattern)[0];
    const contextJson = JSON.parse(context.replace("csod.context=", "").replace("}}};", "}}}"));

    fetch(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 
        'Content-Type':'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Authorization':`Bearer ${contextJson.token}`
      }
    })
    .then(response => response.json())
    .then(responseData => {
      const jobPostings = responseData.data.requisitions;
      jobPostings.forEach(job => {
        const jobTitle = job.displayJobTitle;
        const jobId = job.requisitionId;
        const externalPath = "https://hella.csod.com/ux/ats/careersite/3/home/requisition/" + jobId + "?c=hella";
         const jobCity = job.locations[0].city;
         finalJobs.push({
        job_title: jobTitle,
         job_link: externalPath,
         country: "Romania",
       city: jobCity,
         company: company.company,
       });
      });
   }).then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));     
    scraper.postApiPeViitor(finalJobs, company, apiKey);      
    const logo = "https://www.hella.com/hella-ro/assets/images/layout_global/ForviaHella_Logo.svg";     
    const postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");    
    postLogo.headers.headers["Content-Type"] = "application/json";     
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));});
  });