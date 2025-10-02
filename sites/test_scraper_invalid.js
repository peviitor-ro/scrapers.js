// Invalid test scraper
const jobs = [
  {
    job_link: "https://example.com/job1",  // Missing job_title
    country: "Romania",
    remote: ["Remote", "INVALID"]  // Invalid: uppercase and invalid value
  },
  {
    job_title: "",  // Empty title
    job_link: "https://example.com/job2",
    country: "Romania",
    extra_field: "not allowed"  // Extra field
  }
];

console.log(JSON.stringify(jobs));
