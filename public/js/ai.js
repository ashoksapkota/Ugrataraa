export async function callGeminiAPI(prompt) {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        return data.success ? data.text : "<p>Error: Could not generate response.</p>";
    } catch (error) {
        console.error("Fetch error:", error);
        return `<p>Error connecting to legal database. Please try again later.</p>`;
    }
}

export function setupAIFeatures() {
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('ai-chat-input');
    const chatBox = document.getElementById('ai-chat-box');
    const btnChecklist = document.getElementById('btn-generate-checklist');
    const checklistOutput = document.getElementById('checklist-output');

    if(btnSendChat && chatInput && chatBox) {
        // Remove old listeners to prevent duplicates on re-render
        const newBtn = btnSendChat.cloneNode(true);
        btnSendChat.parentNode.replaceChild(newBtn, btnSendChat);
        
        newBtn.addEventListener('click', async () => {
            const userText = chatInput.value.trim();
            if(!userText) return;

            chatBox.innerHTML += `<div class="chat-msg msg-user">${userText}</div>`;
            chatInput.value = ''; 
            chatBox.scrollTop = chatBox.scrollHeight;

            const loadingId = 'loading-' + Date.now();
            chatBox.innerHTML += `<div id="${loadingId}" class="chat-msg msg-ai"><i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-2"></i> Analyzing Nepalese Law...</div>`;
            lucide.createIcons(); 
            chatBox.scrollTop = chatBox.scrollHeight;

            const aiHTML = await callGeminiAPI(userText);
            
            document.getElementById(loadingId).remove();
            chatBox.innerHTML += `<div class="chat-msg msg-ai">${aiHTML.replace(/```html|```/g, '')}</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); newBtn.click(); }
        });
    }

    if(btnChecklist && checklistOutput) {
        const newCheckBtn = btnChecklist.cloneNode(true);
        btnChecklist.parentNode.replaceChild(newCheckBtn, btnChecklist);

        newCheckBtn.addEventListener('click', async () => {
            const type = document.getElementById('ai-check-type').value;
            const turnover = document.getElementById('ai-check-turnover').value;
            const fdi = document.getElementById('ai-check-fdi').value;

            if(!type || !turnover) {
                alert("Please select your Business Industry and Expected Turnover.");
                return;
            }

            newCheckBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-2"></i> Generating...`;
            newCheckBtn.disabled = true;
            lucide.createIcons();
            
            checklistOutput.innerHTML = `<div class="flex flex-col items-center justify-center h-full"><i data-lucide="loader-2" class="w-8 h-8 text-gold animate-spin mb-4"></i><p>Compiling Nepalese regulatory requirements...</p></div>`;
            lucide.createIcons();

            const prompt = `Generate a strict, actionable corporate compliance checklist for a business in Nepal. 
            Industry: ${type}, Turnover: ${turnover}, Investment: ${fdi}. 
            Format as an HTML list (<ul>, <li>, <strong>) covering: Initial Registrations, Tax/VAT implications, Annual Audit. Keep it concise without markdown wrapping.`;

            const aiHTML = await callGeminiAPI(prompt);
            
            checklistOutput.innerHTML = aiHTML.replace(/```html|```/g, '');
            newCheckBtn.innerHTML = `✨ Generate Custom Checklist`;
            newCheckBtn.disabled = false;
        });
    }
}