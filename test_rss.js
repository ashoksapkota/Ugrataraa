const Parser = require('rss-parser');

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1'
    }
});

async function test() {
    try {
        const feed = await parser.parseURL('https://news.google.com/rss/search?q=Nepal+finance+economy+business&hl=en-US&gl=US&ceid=US:en');
        console.log("Success!", feed.items.length);
    } catch (err) {
        console.error("RSS Error:", err.message);
    }
}
test();
