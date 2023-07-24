const fs = require("fs");
const path = require("path");
require("jest-expect-message");

const filePath = path.join(__dirname, "./siteJobsCollection.json");
const siteJobsCollectionJSON = fs.readFileSync(filePath, "utf8");
const siteJobsCollection = JSON.parse(siteJobsCollectionJSON);

if (siteJobsCollection.length === 0) {
  test("No new/modified scraper found, skipping tests", () => {
    expect(true).toBeTruthy();
  });
} else {
  describe("Jobs JSON data", () => {
    siteJobsCollection.forEach((siteJobs) => {
      const site = Object.keys(siteJobs)[0];
      const jobs = Object.values(siteJobs)[0];
      describe(`Jobs list for #${site}`, () => {
        test("Typeof jobs must be Array", () => {
          expect(
            Array.isArray(jobs),
            `Received ${typeof jobs} instead`
          ).toBeTruthy();
        });

        test("jobs.length must be non 0", () => {
          expect(
            jobs.length,
            "jobs is either 0 or not an array"
          ).toBeGreaterThan(0);
        });
        test("Each job should have 4 properties", () => {
          jobs.forEach((job) => {
            const keysNr = 4;
            const keysNrReceived = Object.keys(job).length;
            expect(
              keysNrReceived,
              `Expected ${keysNr} keys, received ${keysNrReceived}`
            ).toBe(keysNr);
          });
        });

        test("job_title exists & is not empty", () => {
          jobs.forEach((job) => {
            const { job_title } = job;
            expect(job_title, "job_title is undefined").toBeDefined();
            expect(job_title.trim(), "job_title is empty").toBeTruthy();
          });
        });

        test("job_link exists & is not empty & must be a URL", () => {
          jobs.forEach((job) => {
            const { job_link } = job;
            expect(job_link, "job_link is undefined").toBeDefined();
            expect(job_link.trim(), "job_link is empty").toBeTruthy();
            expect(job_link, "job_link is not a link").toMatch(
              /^https?:\/\/.+/
            ); // URL pattern check
          });
        });

        test("country exists & is not empty", () => {
          jobs.forEach((job) => {
            const { country } = job;
            expect(country, "country is undefined").toBeDefined();
            expect(country.trim(), "country is empty").toBeTruthy();
          });
        });

        test("city exists & is not empty", () => {
          jobs.forEach((job) => {
            const { city } = job;
            expect(city, "city is undefined").toBeDefined();
            expect(city.trim(), "city is empty").toBeTruthy();
          });
        });
      });
    });
  });
}
