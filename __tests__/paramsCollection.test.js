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

        const downloadAndCheckImage = async (logo) => {
          try {
            const response = await fetch(logo);
            if (response.ok) {
              const contentType = response.headers.get("content-type");

              // Check if the content is a valid image format (e.g., PNG, JPEG, GIF)
              const validImageFormats = [
                "image/png",
                "image/jpeg",
                "image/gif",
                "image/bmp",
                "image/webp",
                "image/tiff",
                "image/svg+xml",
                "image/x-icon",
              ];
              if (validImageFormats.includes(contentType)) {
                return false; // Valid image -> easier to return falsy and display the error message
              } else {
                return "Not a valid image";
              }
            } else {
              return "Error response from server";
            }
          } catch (error) {
            console.error("Error downloading image:", error.message);
            return "Error occurred while fetching";
          }
        };

        test("Download and check image validity", async () => {
          const { logo } = values;
          const isNotValidImage = await downloadAndCheckImage(logo);

          expect(isNotValidImage, `Error message: ${isNotValidImage}`).toBeFalsy();
        });
      });
    });
  });
}
