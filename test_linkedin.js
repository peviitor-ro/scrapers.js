const puppeteer = require("puppeteer");

const testLinkedIn = async () => {
  const url = "https://www.linkedin.com/jobs/search/?keywords=BearingPoint&location=Romania";
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const html = await page.content();
    console.log("HTML length:", html.length);
    console.log("First 2000 chars:", html.substring(0, 2000));
  } catch (error) {
    console.error("Error:", error.message);
  }

  await browser.close();
};

testLinkedIn();
