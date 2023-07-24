"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");
const company = { company: "Infineon" };
let finalJobs = [];
const apiKey = process.env.KNOX
const url = 'https://www.infineon.com/search/jobs/jobs'
fetch(url, {
  method: 'POST',
  body:'term=&offset=0&max_results=100&lang=en&country=Romania',
  headers: {
        'authority': 'www.infineon.com',
        'accept': 'application/json, text/javascript, */*; q=0.01', 
        'accept-language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,fr;q=0.5,it;q=0.4,pt;q=0.3,tr;q=0.2,es;q=0.1,pl;q=0.1,la;q=0.1', 
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' ,
        'cookie': 'cookie_consent_1=false; cookie_consent_version=release_2021-09; SESSION=d3d383eb-b610-436d-99c0-07120376d4b0; OptanonAlertBoxClosed=2023-07-18T06:08:47.477Z; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Jul+18+2023+09%3A19%3A39+GMT%2B0300+(Eastern+European+Summer+Time)&version=202301.2.0&isIABGlobal=false&hosts=&consentId=c0cf95da-c208-4697-9a67-b992d325108a&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0&geolocation=RO%3BB&AwaitingReconsent=false' ,
        'dnt': '1' ,
        'origin': 'https://www.infineon.com',
        'referer':' https://www.infineon.com/cms/en/careers/jobsearch/jobsearch/', 
        'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"' ,
        'sec-ch-ua-mobile': '?0' ,
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'empty' ,
        'sec-fetch-mode': 'cors' ,
        'sec-fetch-site': 'same-origin' ,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 
        'x-requested-with': 'XMLHttpRequest' 
  }
})
  .then(response => response.json())
  .then(responseData => {
    
    responseData.pages.items.forEach(obj => {
      const id = uuid.v4();
      const jobTitle = obj.title;
      const city = obj.location[0];
      const link = "https://www.infineon.com" + obj.detail_page_url;
      finalJobs.push({
        id: id,
        job_title: jobTitle,
        job_link: link,
        company: company.company,
        city: city,
        country: "Romania",
      });
    });
  }).then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company, apiKey);

    let logo = "https://www.infineon.com/frontend/release_2023-06-1/dist/resources/img/logo-desktop-en.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });