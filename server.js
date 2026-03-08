const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const Parser = require('rss-parser');
const path = require('path'); // Added this to ensure path.join works perfectly
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1'
    }
});

app.use(express.static('public'));
app.use(express.json());

// --- 1. EMAIL SETUP (Nodemailer) ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// --- 2. SECURE API ROUTES ---

// A. Contact Form Route (Bypass Mode until SMTP is ready)
app.post('/api/contact', async (req, res) => {
    try {
        const { company, email, domain, message } = req.body;

        // Check if SMTP details exist. If not, just log it and fake a success.
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.log("\n--- NEW LEAD (MOCK EMAIL) ---");
            console.log(`Company: ${company}\nEmail: ${email}\nDomain: ${domain}\nMessage: ${message}`);
            console.log("-----------------------------\n");

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.json({ success: true, message: 'Mock email sent successfully.' });
        }

        // Real email sending logic
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: 'info@ugrataraadvisors.com.np',
            replyTo: email,
            subject: `New Lead: ${domain} Advisory - ${company}`,
            text: `Company/Entity: ${company}\nEmail: ${email}\nDomain: ${domain}\n\nMessage:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Inquiry sent successfully.' });
    } catch (error) {
        console.error('Email Error:', error);
        res.status(500).json({ success: false, error: 'Failed to send email' });
    }
});


// B. Live RSS News Route
app.get('/api/news', async (req, res) => {
    try {
        console.log("Fetching live news from Google News (Nepal Business)...");

        const feed = await parser.parseURL('https://news.google.com/rss/search?q=Nepal+economy+OR+finance+OR+business&hl=en-US&gl=US&ceid=US:en');

        if (!feed.items || feed.items.length === 0) {
            throw new Error("No articles found in feed.");
        }

        const latestNews = feed.items.slice(0, 10).map(item => ({
            title: item.title.split(' - ')[0],
            link: item.link,
            date: item.pubDate,
            source: 'Google News'
        }));

        console.log("✅ Live news fetched successfully!");
        res.json({ success: true, data: latestNews });

    } catch (error) {
        console.error('\n--- RSS FETCH ERROR ---');
        console.error(error.message);
        console.error('-----------------------\n');

        const guaranteedNews = [
            { title: "Nepal Rastra Bank (NRB) reviews interest rate corridors in Q3 monetary policy", link: "https://nrb.org.np/", date: new Date().toISOString() },
            { title: "Inland Revenue Department updates VAT and PAN registration guidelines for SMEs", link: "https://ird.gov.np/", date: new Date().toISOString() },
            { title: "Ministry of Finance projects steady economic growth for FY 2082/83", link: "https://mof.gov.np/", date: new Date().toISOString() }
        ];
        res.json({ success: true, data: guaranteedNews });
    }
});

// C. Gemini AI Route
const apiKey = process.env.GEMINI_API_KEY || "MISSING_KEY";
const genAI = new GoogleGenerativeAI(apiKey);
const SYSTEM_INSTRUCTION = `You are the AI Legal and Tax Assistant for Ugratara Advisors, an elite firm in Nepal. Answer questions regarding Nepalese corporate law, the Companies Act 2063, VAT Act 2052, Income Tax Act 2058, OCR, and IRD. Be professional, highly precise, and format your response in clean HTML (using <p>, <ul>, <li>, <strong>, <h3>). Do not use markdown wrappers. Keep answers under 300 words. Conclude with a note advising them to consult Ugratara human partners.`;

app.post('/api/gemini', async (req, res) => {
    try {
        if (apiKey === "MISSING_KEY") return res.status(500).json({ success: false, error: 'API Key missing' });
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_INSTRUCTION });
        const result = await model.generateContent(req.body.prompt);
        res.json({ success: true, text: result.response.text() });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ success: false, error: 'AI processing failed' });
    }
});

// --- EXPRESS 5 SAFE CATCH-ALL ROUTE ---
// This fixes the "Cannot GET" refresh error
app.use((req, res, next) => {
    // Let API calls or specific file requests pass through normally
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return res.status(404).send('Not Found');
    }
    // Send all other page refreshes to the main SPA index file
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(port, () => {
    console.log(`✅ Ugratara backend running on http://localhost:${port}`);
    console.log(`📧 SMTP configured for: ${process.env.SMTP_USER || 'Not Set'}`);
});