"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url =
  "https://api-deutschebank.beesite.de/search/?data={%22LanguageCode%22:%22en%22,%22SearchParameters%22:{%22FirstItem%22:1,%22CountItem%22:500,%22MatchedObjectDescriptor%22:[%22Facet:ProfessionCategory%22,%22Facet:UserArea.ProDivision%22,%22Facet:Profession%22,%22Facet:PositionLocation.CountrySubDivision%22,%22Facet:PositionOfferingType.Code%22,%22Facet:PositionSchedule.Code%22,%22Facet:PositionLocation.City%22,%22Facet:PositionLocation.Country%22,%22Facet:JobCategory.Code%22,%22Facet:CareerLevel.Code%22,%22Facet:PositionHiringYear%22,%22Facet:PositionFormattedDescription.Content%22,%22PositionID%22,%22PositionTitle%22,%22PositionURI%22,%22ScoreThreshold%22,%22OrganizationName%22,%22PositionFormattedDescription.Content%22,%22PositionLocation.CountryName%22,%22PositionLocation.CountrySubDivisionName%22,%22PositionLocation.CityName%22,%22PositionLocation.Longitude%22,%22PositionLocation.Latitude%22,%22PositionIndustry.Name%22,%22JobCategory.Name%22,%22CareerLevel.Name%22,%22PositionSchedule.Name%22,%22PositionOfferingType.Name%22,%22PublicationStartDate%22,%22UserArea.GradEduInstCountry%22,%22PositionImport%22,%22PositionHiringYear%22,%22PositionID%22],%22Sort%22:[{%22Criterion%22:%22PublicationStartDate%22,%22Direction%22:%22DESC%22}]},%22SearchCriteria%22:[{%22CriterionName%22:%22PositionLocation.Country%22,%22CriterionValue%22:176}]}";

const company = { company: "DeutscheBank" };
let finalJobs = [];

const s = new scraper.ApiScraper(url);

s.get()
  .then((data) => {
    const jobs = data.SearchResult.SearchResultItems;

    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.MatchedObjectDescriptor.PositionTitle;
      const job_link =
        "https://careers.db.com/professionals/search-roles/#/professional/job/" +
        job.MatchedObjectDescriptor.PositionID;
      const city = job.MatchedObjectDescriptor.OrganizationName;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        country: "Romania",
        city: city,
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://fontslogo.com/wp-content/uploads/2019/01/Deutsche-Bank-Logo-Font.jpg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });