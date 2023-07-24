"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const url =
  "https://porsche-beesite-production-gjb.app.beesite.de/search/?data=%7B%22LanguageCode%22%3A%22EN%22%2C%22SearchParameters%22%3A%7B%22FirstItem%22%3A1%2C%22CountItem%22%3A1000%2C%22Sort%22%3A%5B%7B%22Criterion%22%3A%22PositionTitle%22%2C%22Direction%22%3A%22DESC%22%7D%5D%2C%22MatchedObjectDescriptor%22%3A%5B%22ID%22%2C%22PositionTitle%22%2C%22PositionURI%22%2C%22PositionShortURI%22%2C%22PositionLocation.CountryName%22%2C%22PositionLocation.CityName%22%2C%22PositionLocation.Longitude%22%2C%22PositionLocation.Latitude%22%2C%22PositionLocation.PostalCode%22%2C%22PositionLocation.StreetName%22%2C%22PositionLocation.BuildingNumber%22%2C%22PositionLocation.Distance%22%2C%22JobCategory.Name%22%2C%22PublicationStartDate%22%2C%22ParentOrganizationName%22%2C%22ParentOrganization%22%2C%22OrganizationShortName%22%2C%22CareerLevel.Name%22%2C%22JobSector.Name%22%2C%22PositionIndustry.Name%22%2C%22PublicationCode%22%2C%22PublicationChannel.Id%22%5D%7D%2C%22SearchCriteria%22%3A%5B%7B%22CriterionName%22%3A%22PositionLocation.Country%22%2C%22CriterionValue%22%3A%5B%22176%22%5D%7D%2C%7B%22CriterionName%22%3A%22PublicationChannel.Code%22%2C%22CriterionValue%22%3A%5B%2212%22%5D%7D%5D%7D";

const s = new scraper.ApiScraper(url);

let finalJobs = [];
const company = { company: "Porsche" };

s.get()
  .then((data) => {
    const jobs = data.SearchResult.SearchResultItems;

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.MatchedObjectDescriptor.PositionTitle;
      const job_link = job.MatchedObjectDescriptor.PositionURI;
      const city = job.MatchedObjectDescriptor.PositionLocation[0].CityName;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: city,
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));
    scraper.postApiPeViitor(finalJobs, company);
  });