const fs = require("fs");
const path = require("path");
require("jest-expect-message");

const filePath = path.join(__dirname, "./paramsCollection.json");
const paramsCollectionJSON = fs.readFileSync(filePath, "utf8");
const paramsCollection = JSON.parse(paramsCollectionJSON);

if (paramsCollection.length === 0) {
  test("No new/modified scraper found, skipping tests", () => {
    expect(true).toBeTruthy();
  });
} else {
  describe("Params JSON data", () => {
    paramsCollection.forEach((params, index) => {
      const filename = Object.keys(params)[0];
      const values = Object.values(params)[0];
      describe(`Params for ${filename}`, () => {
        const keysNr = 3;
        const keysNrReceived = Object.keys(values).length;
        test("There should be 3 properties in param object", () => {
          expect(
            keysNrReceived,
            `Expected ${keysNr} keys, received ${keysNrReceived}`
          ).toBe(keysNr);
        });

        test("company exists & is not empty & matches the filename", () => {
          const { company } = values;
          expect(company, "company is undefined").toBeDefined();
          expect(company.trim(), "company is empty").toBeTruthy();
          const trimmedCompany = company.trim().toLowerCase();
          const trimmedFilename = filename
            .trim()
            .toLowerCase()
            .replace(/\.js$/, "");
          expect(
            trimmedCompany,
            `Company: ${trimmedCompany} doesn't match filename: ${trimmedFilename}`
          ).toEqual(trimmedFilename);
        });

        test("logo exists & is not empty & must be a URL", () => {
          const { logo } = values;
          expect(logo, "params.logo is undefined").toBeDefined();
          expect(logo.trim(), "params.logo is empty").toBeTruthy();
          expect(logo).toMatch(/^(https?:\/\/).+\.(png|svg|jpg|jpeg|gif)$/); // URL pattern check for image formats
        });

        test("apikey exists & is not empty & is uuid4", () => {
          const { apikey } = values;
          expect(apikey, "apikey is undefined").toBeDefined();
          expect(apikey.trim(), "apikey is empty").toBeTruthy();
          expect(apikey).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          ); // Validate UUID format
        });
      });
    });
  });
}
