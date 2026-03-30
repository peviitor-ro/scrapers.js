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
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const html = await page.content();
    
    // Save HTML for inspection
    require('fs').writeFileSync('/tmp/linkedin.html', html);
    
    // Try different selectors
    const jobs = await page.evaluate(() => {
      const results = [];
      // Try common LinkedIn job selectors
      const selectors = [
        '.job-card-container',
        '.job-search-card',
        '.occludable-update',
        '[data-job-id]',
        '.scaffold-layout-list div[data-occludable-job-id]'
      ];
      
      selectors.forEach(sel => {
        const elements = document.querySelectorAll(sel);
        console.log(`Selector ${sel}: found ${elements.length} elements`);
      });
      
      return results;
    });

    console.log("Jobs:", jobs);
  } catch (error) {
    console.error("Error:", error.message);
  }

  await browser.close();
};

testLinkedIn();
