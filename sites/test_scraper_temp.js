// Temporary test scraper
const jobs = [
  {
    job_title: "Software Engineer",
    job_link: "https://example.com/job1",
    country: "Romania",
    city: ["Bucuresti"],
    county: ["Ilfov"],
    remote: ["remote"]
  }
];

console.log(JSON.stringify(jobs));

const getJobs = async () => jobs;
const getParams = () => ({
  company: "Test",
  logo: "https://example.com/logo.png"
});

module.exports = { getJobs, getParams };
