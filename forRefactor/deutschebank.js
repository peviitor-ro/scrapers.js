const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://api-deutschebank.beesite.de/search/?data={%22LanguageCode%22:%22en%22,%22SearchParameters%22:{%22FirstItem%22:1,%22CountItem%22:500,%22MatchedObjectDescriptor%22:[%22Facet:ProfessionCategory%22,%22Facet:UserArea.ProDivision%22,%22Facet:Profession%22,%22Facet:PositionLocation.CountrySubDivision%22,%22Facet:PositionOfferingType.Code%22,%22Facet:PositionSchedule.Code%22,%22Facet:PositionLocation.City%22,%22Facet:PositionLocation.Country%22,%22Facet:JobCategory.Code%22,%22Facet:CareerLevel.Code%22,%22Facet:PositionHiringYear%22,%22Facet:PositionFormattedDescription.Content%22,%22PositionID%22,%22PositionTitle%22,%22PositionURI%22,%22ScoreThreshold%22,%22OrganizationName%22,%22PositionFormattedDescription.Content%22,%22PositionLocation.CountryName%22,%22PositionLocation.CountrySubDivisionName%22,%22PositionLocation.CityName%22,%22PositionLocation.Longitude%22,%22PositionLocation.Latitude%22,%22PositionIndustry.Name%22,%22JobCategory.Name%22,%22CareerLevel.Name%22,%22PositionSchedule.Name%22,%22PositionOfferingType.Name%22,%22PublicationStartDate%22,%22UserArea.GradEduInstCountry%22,%22PositionImport%22,%22PositionHiringYear%22,%22PositionID%22],%22Sort%22:[{%22Criterion%22:%22PublicationStartDate%22,%22Direction%22:%22DESC%22}]},%22SearchCriteria%22:[{%22CriterionName%22:%22PositionLocation.Country%22,%22CriterionValue%22:176}]}";
  const scraper = new Scraper(url);
  const res = await scraper.get_soup("JSON");
  const elements = res.SearchResult.SearchResultItems;

  const jobs = [];

  await Promise.all(
    elements.map(async (elem) => {
      const job_title = elem.MatchedObjectDescriptor.PositionTitle;
      const job_link =
        "https://careers.db.com/professionals/search-roles/#/professional/job/" +
        elem.MatchedObjectDescriptor.PositionID;
      const city = elem.MatchedObjectDescriptor.OrganizationName;

      let cities = [];
      let counties = [];

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city.trim())
      );

      if (c) {
        cities.push(c);
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", cities, counties);
      jobs.push(job);
    })
  );
  return jobs;
};

const run = async () => {
  const company = "DeutscheBank";
  const logo =
    "https://fontslogo.com/wp-content/uploads/2019/01/Deutsche-Bank-Logo-Font.jpg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job