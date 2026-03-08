import { db } from './db.js';

let observer;

const faqData = [
    { q: "What are the income tax slabs for an unmarried individual in Nepal (FY 2082/83)?", a: "Up to NPR 500,000: 1%; NPR 500,001–700,000: 10%; NPR 700,001–1,000,000: 20%; NPR 1,000,001–2,000,000: 30%; NPR 2,000,001–5,000,000: 36%; Above NPR 5,000,000: 39%." },
    { q: "What are the income tax slabs for a married individual in Nepal (FY 2082/83)?", a: "Same slabs but the 1% tier starts at NPR 600,000 (instead of 500,000). All subsequent thresholds are effectively NPR 100,000 higher than single filers." },
    { q: "What is the standard corporate income tax rate in Nepal?", a: "25% for most companies. 30% applies to banks, telecom, and insurance companies. 40% applies to cigarette, liquor, and tobacco manufacturers." },
    { q: "What tax exemptions are available for IT companies in Nepal?", a: "IT companies exporting services enjoy a 75% tax exemption. Startups (turnover below NPR 100 million) are eligible for 100% exemption for up to 5 years." },
    { q: "What is the VAT rate in Nepal?", a: "The standard VAT rate is 13%. Essential goods and services (e.g., basic food, healthcare, education) are exempt. The registration threshold is NPR 5 million annual turnover." },
    { q: "When is the VAT return filing deadline in Nepal?", a: "VAT returns are due monthly (by 25th of the following month) for most businesses, or quarterly for businesses meeting certain criteria." },
    { q: "What are the income tax filing deadlines in Nepal?", a: "Individual tax returns must be filed by the end of Ashwin (mid-October each year). Late filing attracts a penalty of 0.1% per day on unpaid tax." },
    { q: "What is the TDS rate on dividends in Nepal?", a: "TDS on dividends is 5% for residents. For non-resident dividends, higher rates apply as specified by the Income Tax Act." },
    { q: "What is the TDS rate on contracts in Nepal?", a: "TDS on contract payments is 1.5% for resident contractors issuing VAT invoices." },
    { q: "What is presumptive tax for small businesses in Nepal?", a: "Small businesses with annual turnover below NPR 3 million may pay a flat presumptive tax ranging from NPR 2,500 to NPR 7,500 depending on location." },
    { q: "What is the excise duty on alcohol and liquor in Nepal?", a: "Excise duties range from 10% to 50% depending on the product type and alcohol content." },
    { q: "Are electric vehicles (EVs) exempt from excise duty in Nepal?", a: "Yes. Electric vehicles enjoy exemptions or heavily reduced excise duty rates under Nepal's green vehicle policy." },
    { q: "How do I file my income tax return online in Nepal?", a: "File through the IRD's e-filing portal at ird.gov.np. You need to register, obtain your PAN, and upload your financial details." },
    { q: "What is PAN and is it mandatory in Nepal?", a: "PAN (Permanent Account Number) is mandatory for all individuals and businesses with taxable income." },
    { q: "What is the tax treatment of service exports from Nepal?", a: "Service exports are subject to a highly subsidized 5% final tax rate as an incentive for earning foreign currency." },
    { q: "What penalties apply for late tax filing in Nepal?", a: "A penalty of 0.1% per day on the unpaid tax liability applies for late filing, plus additional interest charges." },
    { q: "What is the VAT registration threshold in Nepal?", a: "Businesses with annual turnover exceeding NPR 5,000,000 (Goods) or NPR 2,000,000 (Services) must register for VAT." },
    { q: "What taxes apply to banks and financial institutions in Nepal?", a: "Banks and financial institutions pay a higher corporate tax rate of 30%." },
    { q: "What is the TDS on rent and royalties in Nepal?", a: "TDS on commercial rent is 10% for resident landlords. Royalties paid to residents attract 15% TDS." },
    { q: "Can startups in Nepal get income tax exemptions?", a: "Yes. Startups with annual turnover not exceeding NPR 100 million are eligible for 100% income tax exemption for their first 5 years." },
    { q: "What documents are required for tax filing in Nepal?", a: "Typically required: PAN card, audited financial statements, bank statements, TDS certificates, and VAT returns." },
    { q: "What is the dividend tax for resident shareholders in Nepal?", a: "Dividends paid to resident shareholders are subject to a final withholding tax of 5%." },
    { q: "Where can I find the latest official tax rules and circulars in Nepal?", a: "All official tax rules and circulars are published on the Inland Revenue Department's official website: ird.gov.np." }
];

// ==========================================
// 1. SMART NAVIGATION ROUTER
// ==========================================
window.navigateTo = async function (route, pushState = true) {
    try {
        // Smart routing to handle specific detail pages (e.g. service-detail-audit)
        let baseRoute = route;
        let paramId = null;

        if (route.startsWith('service-detail-')) {
            baseRoute = 'service-detail';
            paramId = route.replace('service-detail-', '');
        } else if (route.startsWith('article-detail-')) {
            baseRoute = 'article-detail';
            paramId = route.replace('article-detail-', '');
        }

        const response = await fetch(`/pages/${baseRoute}.html`);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();

        // Auto-Inject Back Button for Sub-Pages
        let finalHtml = html;
        if (baseRoute !== 'home') {
            finalHtml = `
            <div class="max-w-7xl mx-auto px-6 lg:px-12 pt-8 -mb-10 relative z-10">
                <button onclick="window.history.back()" class="flex items-center text-themeMuted hover:text-gold transition-colors text-xs font-semibold tracking-widest uppercase interactable group">
                    <i data-lucide="arrow-left" class="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform"></i> Back
                </button>
            </div>` + html;
        }

        document.getElementById('app-root').innerHTML = finalHtml;
        window.scrollTo(0, 0);

        // Update Browser History
        if (pushState) {
            const urlPath = route === 'home' ? '/' : `/${route}`;
            window.history.pushState({ route: route }, '', urlPath);
        }

        // Update SEO Titles
        const titles = { 'home': 'Ugratara Advisors', 'about': 'About Us | Ugratara', 'services': 'Services | Ugratara', 'faq': 'Knowledge Base | Ugratara', 'contact': 'Contact | Ugratara' };
        document.title = titles[baseRoute] || 'Ugratara Advisors';

        // --- AUTOMATICALLY TRIGGER RENDERS BASED ON THE PAGE YOU LOADED ---
        if (baseRoute === 'home') {
            renderHomeGrids();
            loadNewsTicker(); // <--- THIS TURNS THE TICKER ON!
        }

        if (baseRoute === 'ai-assistant') initAIAssistant();
        if (baseRoute === 'services') renderFullServices();
        if (baseRoute === 'intelligence') renderFullArticles();
        if (baseRoute === 'faq') initFAQ();
        if (baseRoute === 'service-detail' && paramId) loadServiceDetail(paramId);
        if (baseRoute === 'article-detail' && paramId) loadArticleDetail(paramId);

        lucide.createIcons();
        initReveals();
        bindCustomCursor();

    } catch (error) {
        console.error('Navigation Error:', error);
        if (route !== 'home') navigateTo('home', false);
    }
};

window.addEventListener('popstate', (event) => {
    const route = event.state && event.state.route ? event.state.route : 'home';
    navigateTo(route, false);
});


// ==========================================
// 2. PAGE RENDERING FUNCTIONS
// ==========================================
function renderHomeGrids() {
    const sGrid = document.getElementById('home-services-grid');
    if (sGrid && db.services) {
        sGrid.innerHTML = db.services.slice(0, 4).map(s => `<div class="service-card p-8 rounded cursor-pointer interactable" onclick="navigateTo('service-detail-${s.id}')"><i data-lucide="${s.icon}" class="w-8 h-8 text-gold mb-6"></i><h3 class="font-serif text-xl font-semibold mb-3">${s.title}</h3><p class="text-themeMuted font-light text-sm">${s.brief}</p></div>`).join('');
    }

    const aGrid = document.getElementById('home-articles-grid');
    if (aGrid && db.articles) {
        aGrid.innerHTML = db.articles.slice(0, 3).map(a => `<div class="border border-themeBorder p-8 rounded hover:border-gold transition-colors cursor-pointer interactable group" onclick="navigateTo('article-detail-${a.id}')"><span class="text-themeMuted text-[10px] font-semibold tracking-widest mb-3 block uppercase">${a.category}</span><h3 class="font-serif text-2xl font-semibold mb-3 group-hover:text-gold transition-colors line-clamp-2">${a.title}</h3><p class="text-themeMuted font-light text-sm mb-4 line-clamp-2">${a.brief}</p><span class="text-gold text-xs font-semibold uppercase tracking-widest">Read Article →</span></div>`).join('');
    }
}

function renderFullServices() {
    const grid = document.getElementById('full-services-grid');
    if (grid && db.services) {
        grid.innerHTML = db.services.map(s => `<div class="service-card p-8 rounded-lg cursor-pointer interactable flex flex-col h-full" onclick="navigateTo('service-detail-${s.id}')"><i data-lucide="${s.icon}" class="w-8 h-8 text-gold mb-6"></i><h3 class="font-serif text-xl font-semibold mb-3">${s.title}</h3><p class="text-themeMuted font-light text-sm flex-grow mb-6">${s.brief}</p><span class="text-gold text-xs font-semibold uppercase tracking-widest border-t border-themeBorder pt-4 inline-block w-full">View Details →</span></div>`).join('');
    }
}

function renderFullArticles() {
    const grid = document.getElementById('full-articles-grid');
    if (grid && db.articles) {
        grid.innerHTML = db.articles.map(a => `<div class="border border-themeBorder bg-themeSurface p-8 rounded hover:border-gold transition-all duration-300 group interactable cursor-pointer flex flex-col h-full" onclick="navigateTo('article-detail-${a.id}')"><div class="flex justify-between items-start mb-4"><span class="text-gold text-[10px] font-semibold tracking-widest uppercase bg-themeBg px-2 py-1 rounded">${a.category}</span><span class="text-themeMuted text-xs">${a.time}</span></div><h3 class="font-serif text-xl font-semibold mb-4 group-hover:text-gold transition-colors">${a.title}</h3><p class="text-themeMuted font-light text-sm mb-6 flex-grow">${a.brief}</p><span class="text-xs font-semibold uppercase tracking-widest flex items-center text-themeText group-hover:text-gold border-t border-themeBorder pt-4 w-full">Read Guide <i data-lucide="arrow-right" class="w-4 h-4 ml-2"></i></span></div>`).join('');
    }
}

function loadServiceDetail(id) {
    const s = db.services.find(x => x.id === id);
    if (!s) return;
    document.getElementById('dynamic-service-content').innerHTML = `
        <div class="flex items-center gap-4 mb-6"><i data-lucide="${s.icon}" class="w-8 h-8 text-gold"></i><span class="text-gold uppercase tracking-[0.2em] text-xs font-semibold">Service Architecture</span></div>
        <h1 class="font-serif text-4xl md:text-5xl font-semibold mb-8 text-themeText">${s.title}</h1>
        <div class="prose max-w-none"><h3>Executive Overview</h3><p>${s.overview}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10"><div><h3>Scope of Work</h3><ul>${s.scope.map(x => `<li>${x}</li>`).join('')}</ul></div><div><h3>Key Deliverables</h3><ul>${s.deliverables.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
        <h3>Implementation Methodology</h3><div class="space-y-4 mt-4 border-l border-gold pl-6">${s.steps.map((x, i) => `<div class="relative"><span class="absolute -left-9 w-6 h-6 bg-navy border border-gold rounded-full flex items-center justify-center text-[10px] text-gold">${i + 1}</span><p class="m-0 text-themeText font-medium">${x}</p></div>`).join('')}</div>
        <div class="bg-themeBg border border-themeBorder p-6 rounded mt-12"><h4 class="text-gold font-serif text-xl mb-2">Why Ugratara?</h4><p class="text-sm m-0">${s.why}</p></div></div>`;
}

function loadArticleDetail(id) {
    const a = db.articles.find(x => x.id === id);
    if (!a) return;
    document.getElementById('dynamic-article-content').innerHTML = `
        <div class="flex justify-between items-center border-b border-themeBorder pb-6 mb-8"><span class="text-gold uppercase tracking-[0.2em] text-xs font-semibold bg-themeBg px-3 py-1 rounded">${a.category}</span><span class="text-themeMuted text-sm font-light">Reading Time: ${a.time}</span></div>
        <h1>${a.title}</h1><p class="text-lg font-medium text-themeText border-l-2 border-gold pl-4 mb-8">${a.brief}</p>${a.content}
        <div class="mt-16 bg-navy p-8 rounded border border-gold text-center"><h4 class="text-white font-serif text-2xl mb-4">Need personalized advice?</h4><button onclick="navigateTo('contact')" class="btn-solid-gold px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold interactable">Consult Ugratara Experts</button></div>`;
}


// ==========================================
// 3. UI COMPONENTS (FAQ, Ticker, Cursor)
// ==========================================

function initTheme() {
    const themeBtn = document.getElementById('themeToggle');
    const themeBtnMobile = document.getElementById('themeToggleMobile');

    const toggle = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    if (themeBtn) {
        // Remove old listeners to prevent duplicates
        const newBtn = themeBtn.cloneNode(true);
        themeBtn.parentNode.replaceChild(newBtn, themeBtn);
        newBtn.addEventListener('click', toggle);
    }

    if (themeBtnMobile) {
        const newBtnMobile = themeBtnMobile.cloneNode(true);
        themeBtnMobile.parentNode.replaceChild(newBtnMobile, themeBtnMobile);
        newBtnMobile.addEventListener('click', toggle);
    }
}

function initFAQ() {
    const container = document.getElementById('faq-container');
    const searchInput = document.getElementById('faq-search');
    if (!container || !searchInput) return;

    const renderFAQs = (data) => {
        container.innerHTML = data.map((item, index) => `
            <div class="faq-item bg-themeSurface border border-themeBorder rounded-lg overflow-hidden transition-all duration-300">
                <button class="faq-btn w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none interactable group" data-index="${index}">
                    <span class="font-serif text-lg font-medium text-themeText group-hover:text-gold transition-colors pr-4">${item.q}</span>
                    <i data-lucide="chevron-down" class="w-5 h-5 text-gold transform transition-transform duration-300 faq-icon"></i>
                </button>
                <div class="faq-content hidden px-6 pb-6 text-themeMuted text-sm leading-relaxed border-t border-themeBorder/50 mt-2 pt-4">
                    ${item.a}
                </div>
            </div>
        `).join('');
        lucide.createIcons();
        bindFAQEvents();
    };

    const bindFAQEvents = () => {
        document.querySelectorAll('.faq-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const content = this.nextElementSibling;
                const icon = this.querySelector('.faq-icon');

                document.querySelectorAll('.faq-content').forEach(el => {
                    if (el !== content) el.classList.add('hidden');
                });
                document.querySelectorAll('.faq-icon').forEach(el => {
                    if (el !== icon) el.classList.remove('rotate-180');
                });

                content.classList.toggle('hidden');
                icon.classList.toggle('rotate-180');
            });
        });
    };

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = faqData.filter(item => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term));
        renderFAQs(filtered);
    });

    renderFAQs(faqData);
}


// ==========================================
// AI HUB LOGIC (Chat & Checklist Generator)
// ==========================================

function initAIAssistant() {
    // 1. Grab all the elements from your HTML
    const chatBtn = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('ai-chat-input');
    const genBtn = document.getElementById('btn-generate-checklist');

    // 2. Bind Chat Button
    if (chatBtn) {
        // Clone to prevent duplicate clicks during SPA navigation
        const newChatBtn = chatBtn.cloneNode(true);
        chatBtn.parentNode.replaceChild(newChatBtn, chatBtn);
        newChatBtn.addEventListener('click', handleAIChat);
    }

    // 3. Bind Enter Key for Chat Input
    if (chatInput) {
        const newChatInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
        newChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevents adding a new line
                handleAIChat();
            }
        });
    }

    // 4. Bind Checklist Generator Button
    if (genBtn) {
        const newGenBtn = genBtn.cloneNode(true);
        genBtn.parentNode.replaceChild(newGenBtn, genBtn);
        newGenBtn.addEventListener('click', handleChecklistGenerate);
    }
}


// --- FEATURE 1: AI CHAT ---
async function handleAIChat() {
    const inputField = document.getElementById('ai-chat-input');
    const chatBox = document.getElementById('ai-chat-box');
    
    if (!inputField || !chatBox || inputField.value.trim() === '') return;

    const userText = inputField.value.trim();
    inputField.value = ''; 

    // Add User Message
    chatBox.innerHTML += `
        <div class="chat-msg msg-user">
            ${userText}
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Add "Thinking" Animation
    const typingId = 'typing-' + Date.now();
    chatBox.innerHTML += `
        <div id="${typingId}" class="chat-msg msg-ai animate-pulse">
            <span class="text-gold">Ugratara AI is researching...</span>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userText })
        });

        const data = await response.json();
        
        // Remove the typing indicator
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        // If the server was successful, show the answer
        if (response.ok && data.success) {
            chatBox.innerHTML += `<div class="chat-msg msg-ai">${data.text}</div>`;
        } else {
            // If the server blocked us (Rate Limit), show the exact error message!
            const errorMessage = data.error || 'Server error occurred.';
            chatBox.innerHTML += `<div class="chat-msg msg-ai text-red-400 border border-red-500/30 bg-red-500/10">
                <strong class="text-red-500">Notice:</strong> ${errorMessage}
            </div>`;
        }
    } catch (error) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        chatBox.innerHTML += `<div class="chat-msg msg-ai text-red-400 border border-red-500/30 bg-red-500/10">Connection lost. Please check your internet or contact Ugratara.</div>`;
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- FEATURE 2: SMART CHECKLIST GENERATOR ---
async function handleChecklistGenerate() {
    const type = document.getElementById('ai-check-type').value;
    const turnover = document.getElementById('ai-check-turnover').value;
    const fdi = document.getElementById('ai-check-fdi').value;
    const outputBox = document.getElementById('checklist-output');

    // Validation
    if (!type || !turnover) {
        outputBox.innerHTML = `<p class="text-red-500 text-center font-semibold mt-4">⚠️ Please select a Business Industry and Turnover bracket to generate the checklist.</p>`;
        return;
    }

    const systemPrompt = `Act as a senior Nepalese Corporate Lawyer. Generate a strict, step-by-step corporate, OCR, and tax compliance checklist for a newly registered "${type}" business in Nepal. 
    Expected annual turnover: "${turnover}". 
    FDI Status: "${fdi}". 
    Format the output beautifully in HTML using <h3>, <ul>, <li>, and <strong> tags. Make it look like a highly professional corporate document. Keep it under 350 words. Do not use markdown backticks like \`\`\`html.`;

    // Show Loading Spinner
    outputBox.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full animate-pulse mt-10">
            <div class="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-center text-gold font-semibold tracking-widest uppercase text-xs">Analyzing Nepalese Law...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: systemPrompt })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Inject the generated HTML document
            outputBox.innerHTML = `<div class="animate-fadeIn">${data.text}</div>`;
        } else {
            // Show Rate Limit error inside the checklist box
            const errorMessage = data.error || 'Failed to generate checklist.';
            outputBox.innerHTML = `<p class="text-red-500 text-center mt-4 p-4 border border-red-500/30 bg-red-500/10 rounded">⚠️ <strong>Notice:</strong> ${errorMessage}</p>`;
        }
    } catch (error) {
        outputBox.innerHTML = `<p class="text-red-500 text-center mt-4">⚠️ Connection lost. Please try again later.</p>`;
    }
}

// FULLY RESTORED NEWS TICKER LOGIC
async function loadNewsTicker() {
    const wrap = document.getElementById('news-ticker-wrap');
    const content = document.getElementById('news-ticker-content');
    if (!wrap || !content) return;

    try {
        const res = await fetch('/api/news');
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const headlinesHtml = data.data.map(item => {
                const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `<span class="ticker-item"><span class="text-white opacity-60 mr-2 uppercase text-[10px] tracking-widest">[${date}]</span> <a href="${item.link}" target="_blank" class="hover:text-white transition-colors cursor-pointer interactable">${item.title}</a></span>`;
            }).join('');

            content.innerHTML = headlinesHtml;
            wrap.classList.remove('hidden'); // This makes it visible!
            bindCustomCursor();
        } else {
            content.innerHTML = `<span class="ticker-item text-themeMuted">Live financial news feed temporarily unavailable.</span>`;
            wrap.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Failed to load news ticker:", error);
    }
}

function initReveals() {
    if (observer) observer.disconnect();
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => el.classList.remove('active'));
    observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('active'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    setTimeout(() => reveals.forEach(el => observer.observe(el)), 50);
}

function bindCustomCursor() {
    if (window.innerWidth > 768) {
        document.querySelectorAll('.interactable, a, button, input, textarea, select').forEach(el => {
            if (!el.dataset.cursorBound) {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
                el.dataset.cursorBound = "true";
            }
        });
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const iconMenu = document.getElementById('mobile-icon-menu');
    const iconClose = document.getElementById('mobile-icon-close');
    if (mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open'); iconMenu.classList.remove('hidden'); iconClose.classList.add('hidden'); document.body.style.overflowY = 'auto';
    } else {
        mobileMenu.classList.add('open'); iconMenu.classList.add('hidden'); iconClose.classList.remove('hidden'); document.body.style.overflowY = 'hidden';
    }
}

// ==========================================
// 4. BOOTSTRAPPER 
// ==========================================
async function boot() {
    try {
        const navRes = await fetch('/components/nav.html');
        document.getElementById('nav-placeholder').innerHTML = await navRes.text();

        const footerRes = await fetch('/components/footer.html');
        document.getElementById('footer-placeholder').innerHTML = await footerRes.text();

        initTheme();

        const themeToggleMobile = document.getElementById('themeToggleMobile');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');

        if (themeToggleMobile) themeToggleMobile.addEventListener('click', () => document.documentElement.classList.toggle('dark'));
        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);

        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 20) { navbar.classList.add('nav-scrolled', 'py-2'); navbar.classList.remove('py-4', 'md:py-6', 'border-transparent'); }
            else { navbar.classList.remove('nav-scrolled', 'py-2'); navbar.classList.add('py-4', 'md:py-6', 'border-transparent'); }
        });

        if (window.innerWidth > 768) {
            const cursorDot = document.querySelector('.cursor-dot');
            const cursorOutline = document.querySelector('.cursor-outline');
            if (cursorDot && cursorOutline) {
                window.addEventListener('mousemove', (e) => {
                    cursorDot.style.left = `${e.clientX}px`; cursorDot.style.top = `${e.clientY}px`;
                    cursorOutline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 500, fill: "forwards", easing: "ease-out" });
                });
            }
        }


        // Read the URL and Navigate to the correct page
        const pathRoute = window.location.pathname.substring(1) || 'home';
        await navigateTo(pathRoute, false);

    } catch (error) {
        console.error("Boot sequence failed:", error);
    }
}

document.addEventListener('DOMContentLoaded', boot);