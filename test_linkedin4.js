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

    const jobs = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.base-search-card');
      console.log(`Found ${cards.length} cards`);
      
      cards.forEach(card => {
        const titleEl = card.querySelector('.base-search-card__title');
        const subtitleEl = card.querySelector('.base-search-card__subtitle');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('.base-search-card__info a');
        
        if (titleEl) {
          results.push({
            title: titleEl.textContent.trim(),
            company: subtitleEl ? subtitleEl.textContent.trim() : '',
            location: locationEl ? locationEl.textContent.trim() : '',
            link: linkEl ? linkEl.href : ''
          });
        }
      });
      return results;
    });

    console.log("Found", jobs.length, "jobs");
    jobs.forEach(job => {
      console.log(JSON.stringify(job));
    });
  } catch (error) {
    console.error("Error:", error.message);
  }

  await browser.close();
};

testLinkedIn();
