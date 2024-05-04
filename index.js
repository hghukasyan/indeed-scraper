const puppeteer = require('puppeteer-extra');
const cheerio = require('cheerio');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeShopifyProductPage(params) {

    const host = `https://www.indeed.com`;

    // You can set headless to false for debugging
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();

    // Set up some extra options for stealthiness
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9', // Set preferred languages
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36' // Set a common user agent
    });

    // Set a common viewport size
    await page.setViewport({
        width: 1366, height: 768
    });

    // Navigate to the product page
    await page.goto(host, { waitUntil: 'networkidle2' });

    await page.type('#text-input-what', params.query);
    await page.type('#text-input-where', params.location);
    await page.click('button[type="submit"]');

    // Get page content
    const content = await page.content();

    // Load content to cheerio
    const $ = cheerio.load(content);

    // Search list result
    const searchResult = [];

    $('div[id*=-jobResults] > div > ul > li').each(function (i, el){
        const title = $(el).find('a[class*="JobTitle"]').text().trim();
        const url = $(el).find('a[class*="JobTitle"]').attr('href');
        const company_name = $(el).find('[data-testid="company-name"]').text();
        const location = $(el).find('[data-testid="text-location"]').text();

        const metaData = $(el).find('.jobMetaDataGroup');
        const publish_date = metaData.find('[data-testid="myJobsStateDate"]').text();

        metaData.find('[data-testid="myJobsStateDate"]').remove();
        const short_desc = metaData.text().trim();

        if(!title || !url) {
            return;
        }

        searchResult.push({
            title,
            url: `${host}${url}`,
            company_name,
            location,
            short_desc,
            publish_date
        })
    });

    await browser.close();

    return searchResult;
}

// Example usage
const params = {
    query: 'Software Engineer',
    location: 'Remote'
}

scrapeShopifyProductPage(params).then(productData => {
    console.log(productData);
}).catch(err => console.error(err));
