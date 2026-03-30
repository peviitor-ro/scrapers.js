const puppeteer = require("puppeteer");

const testLinkedIn = async () => {
  const url = "https://www.linkedin.com/jobs/search/?keywords=BearingPoint&location=Romania&f_TPR=r604800";
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
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const jobs = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.job-card-container');
      cards.forEach(card => {
        const title = card.querySelector('.job-card-list__title--link');
        const company = card.querySelector('.job-card-container__company-name');
        const location = card.querySelector('.job-card-container__metadata-item');
        if (title) {
          results.push({
            title: title.textContent.trim(),
            link: title.href,
            company: company ? company.textContent.trim() : '',
            location: location ? location.textContent.trim() : ''
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
