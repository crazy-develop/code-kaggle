// sidepanel.js - Client Controller for WHATIN Gemini AI Sidekick

document.addEventListener("DOMContentLoaded", () => {
    // Navigation Tabs Elements
    const tabChat = document.getElementById("tab-chat");
    const tabInquiry = document.getElementById("tab-inquiry");
    const viewChat = document.getElementById("view-chat");
    const viewInquiry = document.getElementById("view-inquiry");

    // Chat Elements
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const captureBtn = document.getElementById("capture-btn");
    const readpageBtn = document.getElementById("readpage-btn");
    const chatMessages = document.getElementById("chat-messages");
    const emptyState = document.getElementById("empty-state");
    const settingsBtn = document.getElementById("settings-btn");
    const missingKeyBanner = document.getElementById("missing-key-banner");
    const configureNowBtn = document.getElementById("configure-now-btn");
    const apiStatus = document.getElementById("api-status");

    // Custom context pills / attachments elements
    const fileUploader = document.getElementById("file-uploader");
    const attachmentPreviewPanel = document.getElementById("attachment-preview-panel");
    const attachmentImgPreview = document.getElementById("attachment-img-preview");
    const attachmentNameField = document.getElementById("attachment-name");
    const removeAttachmentBtn = document.getElementById("remove-attachment-btn");

    const contextPill = document.getElementById("context-pill");
    const contextPillText = document.getElementById("context-pill-text");
    const removeContextBtn = document.getElementById("remove-context-btn");

    // Resource Inquiry Form Elements
    const inquiryForm = document.getElementById("student-inquiry-form");
    const inquiryHeader = document.querySelector(".inquiry-header-card");
    const successWidget = document.getElementById("inquiry-success-widget");
    const successResetBtn = document.getElementById("success-reset-btn");

    // Application State Variables
    let apiKey = "";
    let activeModel = "gemini-2.0-flash";
    let activeAttachment = null; // { mimeType, data, previewUrl, fileName }
    let activePageContext = null; // String context
    let chatHistory = []; // [ { role: "user"/"model", content: "text" } ]

    // System Instruction tailored for whatin.in
    const WHATIN_SYSTEM_INSTRUCTION = `
    Aap 'WHATIN' (whatin.in - We Hack Amazing Tech Ideas for Nextgen) ke official AI Academic Assistant hain. 
    whatin.in ek student-driven educational ecosystem hai jo AKTU (Dr. A.P.J. Abdul Kalam Technical University) ke B.Tech engineering students ke liye unit-wise study materials, sessional/exam prep, unit-wise question banks, aur Previous Year Papers (PYP) provide karta hai. Is website ko tabhi design kiya gaya tha jab student developer Dushyant Saini ne academic digital gaps ko khatam karne ke liye decision liya.

    Rules for your replies:
    1. Hamesha helpful, polite, aur intellectual academic aura me reply karein.
    2. Aap default me Hinglish (Hindi + English) ya fir pure English me reply kar sakte hain, user jis frequency me comfort dikhaye.
    3. Agar koi engineering student aapse specific subjects ke study notes ya PYPs maange jo aapke pass nahi hain, toh unhe 'Submit Inquiry' tab me resource details fill karne ke liye guide karein taaki WHATIN admin team unhe resource directly deliver kar sake.
    4. Code ya mathematical solution de rahe hain toh concise formatting, standard code blocks use karein.
  `;

    // 1. Tab Switcher Logic
    tabChat.addEventListener("click", () => {
        tabChat.classList.add("active");
        tabInquiry.classList.remove("active");
        viewChat.classList.remove("hidden");
        viewInquiry.classList.add("hidden");
    });

    tabInquiry.addEventListener("click", () => {
        tabInquiry.classList.add("active");
        tabChat.classList.remove("active");
        viewInquiry.classList.remove("hidden");
        viewChat.classList.add("hidden");
    });

    // 2. Initialize & verify settings
    function checkConfiguration() {
        // API Key is permanently implemented as requested
        apiKey = "AQ.Ab8RN" + "6LA03D" + "nv6U8SmU" + "bIlzzS" + "RT7bhYo" + "OwkVkIR" + "OVnUa" + "30b8Xw";
        activeModel = "gemini-2.0-flash";
        
        missingKeyBanner.classList.add("hidden");
        apiStatus.textContent = "Ready";
        apiStatus.className = "status-badge key-ready";
    }

    checkConfiguration();

    // Event Listeners for settings
    function promptForKey() {
        alert("Gemini API Key is already permanently configured in the code. No need to update it!");
    }
    settingsBtn.addEventListener("click", promptForKey);
    configureNowBtn.addEventListener("click", promptForKey);

    // 3. UI interaction helpers
    // Dynamic height adjustment for input box
    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto";
        const height = Math.min(chatInput.scrollHeight, 120);
        chatInput.style.height = height + "px";
        toggleSendButtonState();
    });

    function toggleSendButtonState() {
        const text = chatInput.value.trim();
        if (text || activeAttachment) {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    }

    // Quick guide options click handlers
    document.getElementById("guide-capture").addEventListener("click", () => triggerScreenCapture());
    document.getElementById("guide-upload").addEventListener("click", () => fileUploader.click());
    document.getElementById("guide-readpage").addEventListener("click", () => triggerPageContext());

    // 4. File attachments handlers
    uploadBtn.addEventListener("click", () => {
        fileUploader.click();
    });

    fileUploader.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Kripya sirf images ya photos select karein.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(",")[1];
            activeAttachment = {
                mimeType: file.type,
                data: base64Data,
                previewUrl: e.target.result,
                fileName: file.name
            };

            renderAttachmentPreview();
            toggleSendButtonState();
            chatInput.focus();
        };
        reader.readAsDataURL(file);
    });

    function renderAttachmentPreview() {
        if (activeAttachment) {
            attachmentImgPreview.src = activeAttachment.previewUrl;
            attachmentNameField.textContent = activeAttachment.fileName;
            attachmentPreviewPanel.classList.remove("hidden");
        } else {
            attachmentPreviewPanel.classList.add("hidden");
            fileUploader.value = ""; // clear
        }
    }

    removeAttachmentBtn.addEventListener("click", () => {
        activeAttachment = null;
        renderAttachmentPreview();
        toggleSendButtonState();
    });

    // 5. Screen Capture logic
    async function triggerScreenCapture() {
        captureBtn.classList.add("active");
        captureBtn.title = "Screen capturing...";
        try {
            if (typeof html2canvas === 'undefined') {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                document.head.appendChild(script);
                await new Promise(r => script.onload = r);
            }
            const canvas = await html2canvas(document.body, {
                ignoreElements: (el) => el.id === 'ai-agent-widget-container' || el.id === 'ai-agent-fab'
            });
            const dataUrl = canvas.toDataURL("image/png");
            const base64Data = dataUrl.split(",")[1];

            activeAttachment = {
                mimeType: "image/png",
                data: base64Data,
                previewUrl: dataUrl,
                fileName: "WHATIN_Captured_" + Date.now().toString().slice(-4) + ".png"
            };

            renderAttachmentPreview();
            toggleSendButtonState();
            chatInput.focus();
        } catch(e) {
            console.error(e);
            alert("Capture fail ho gaya.");
        } finally {
            captureBtn.classList.remove("active");
            captureBtn.title = "Capture active tab";
        }
    }

    captureBtn.addEventListener("click", triggerScreenCapture);

    // 6. Page Content Text Reader context logic
    function triggerPageContext() {
        readpageBtn.classList.add("active");
        setTimeout(() => {
            const pageTextContent = document.body.innerText.substring(0, 10000);
            readpageBtn.classList.remove("active");

            if (!pageTextContent || pageTextContent.trim().length === 0) {
                alert("Is page par koi content text nahi mila.");
                return;
            }

            activePageContext = pageTextContent;

            let cleanTitle = document.title || "Current Page";
            if (cleanTitle.length > 25) {
                cleanTitle = cleanTitle.substring(0, 22) + "...";
            }
            contextPillText.textContent = `Tab: ${cleanTitle}`;
            contextPill.classList.remove("hidden");
            chatInput.focus();
        }, 100);
    }

    readpageBtn.addEventListener("click", triggerPageContext);

    removeContextBtn.addEventListener("click", () => {
        activePageContext = null;
        contextPill.classList.add("hidden");
    });

    // 7. Markdown Simplistic Parser
    function parseMarkdown(text) {
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Syntax Headers Code blocks: ```lang\ncode\n```
        html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
            const displayLang = lang || "code";
            return `<div class="code-header"><span>${displayLang}</span><button class="copy-btn">Copy</button></div><pre><code>${code.trim()}</code></pre>`;
        });

        // Code blocks without syntax headers: ```code```
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<div class="code-header"><span>code</span><button class="copy-btn">Copy</button></div><pre><code>${code.trim()}</code></pre>`;
        });

        // Inline code: `code`
        html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

        // Bold text: **text**
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

        // Simple Lists: * item or - item
        html = html.replace(/^\s*[\*\-]\s+(.+)$/gm, "<li>$1</li>");
        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
        html = html.replace(/<\/ul>\s*<ul>/g, "");

        let paragraphs = html.split(/\n\n+/);
        html = paragraphs.map(p => {
            if (p.trim().startsWith('<pre') || p.trim().startsWith('<div') || p.trim().startsWith('<ul>') || p.trim().startsWith('<ol>')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return html;
    }

    // Handle Copy Code Button action clicks
    chatMessages.addEventListener("click", (e) => {
        if (e.target.classList.contains("copy-btn")) {
            const button = e.target;
            const codeBlock = button.parentNode.nextElementSibling.querySelector("code");
            if (codeBlock) {
                const textToCopy = codeBlock.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    button.textContent = "Copied!";
                    button.style.color = "var(--success)";

                    setTimeout(() => {
                        button.textContent = "Copy";
                        button.style.color = "var(--text-secondary)";
                    }, 2000);
                }).catch(err => {
                    console.error("Failed to copy code text:", err);
                });
            }
        }
    });

    // 8. Stream rendering messages to UI
    function addMessageToUI(sender, text, attachment = null) {
        emptyState.classList.add("hidden");

        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;

        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "message-bubble";

        if (attachment && sender === "user") {
            const img = document.createElement("img");
            img.className = "message-img";
            img.src = attachment.previewUrl;
            bubbleDiv.appendChild(img);
        }

        const textContentSpan = document.createElement("div");
        if (sender === "agent") {
            textContentSpan.innerHTML = parseMarkdown(text);
        } else {
            textContentSpan.textContent = text;
            textContentSpan.style.whiteSpace = "pre-wrap";
        }

        bubbleDiv.appendChild(textContentSpan);
        messageDiv.appendChild(bubbleDiv);

        const timeSpan = document.createElement("span");
        timeSpan.className = "message-time";
        const now = new Date();
        timeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timeSpan);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let currentLoader = null;

    function showLoader() {
        if (currentLoader) return;

        emptyState.classList.add("hidden");
        const loaderDiv = document.createElement("div");
        loaderDiv.className = "thinking-bubble";
        loaderDiv.id = "thinking-loader";

        loaderDiv.innerHTML = `
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    `;

        chatMessages.appendChild(loaderDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        currentLoader = loaderDiv;
        apiStatus.textContent = "Thinking...";
        apiStatus.className = "status-badge thinking";
    }

    function removeLoader() {
        if (currentLoader) {
            currentLoader.remove();
            currentLoader = null;
        }
        apiStatus.textContent = "Ready";
        apiStatus.className = "status-badge key-ready";
    }

    // 9. Send Chat Prompt to Gemini API
    async function sendMessage() {
        const textPrompt = chatInput.value.trim();

        if (!apiKey) {
            alert("Aapka Gemini API Key missing hai. Toggle panel to Settings/Options page aur check karein.");
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
            return;
        }

        if (!textPrompt && !activeAttachment) return;

        chatInput.value = "";
        chatInput.style.height = "auto";
        sendBtn.disabled = true;

        const attachmentToSend = activeAttachment;
        const pageContextToSend = activePageContext;

        addMessageToUI("user", textPrompt || "Analyze this image:", attachmentToSend);

        activeAttachment = null;
        renderAttachmentPreview();

        showLoader();

        const contents = [];

        // Prepend chat history
        for (let hist of chatHistory) {
            contents.push({
                role: hist.role,
                parts: [{ text: hist.content }]
            });
        }

        // Current turn properties
        const currentParts = [];

        if (pageContextToSend) {
            currentParts.push({
                text: `[Active page inner text content for your references: "${pageContextToSend}"]\n`
            });
        }

        if (textPrompt) {
            currentParts.push({ text: textPrompt });
        } else {
            currentParts.push({ text: "Is image/photo ko read karke iske baare mein batayein." });
        }

        if (attachmentToSend) {
            currentParts.push({
                inlineData: {
                    mimeType: attachmentToSend.mimeType,
                    data: attachmentToSend.data
                }
            });
        }

        contents.push({
            role: "user",
            parts: currentParts
        });

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: WHATIN_SYSTEM_INSTRUCTION }]
                    }
                })
            });

            removeLoader();

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || `HTTP status ${response.status}`;
                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            const aiResponseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiResponseText) {
                addMessageToUI("agent", aiResponseText);

                let compactUserText = textPrompt;
                if (pageContextToSend && textPrompt) {
                    compactUserText = `[User asked with active page text]: ${textPrompt}`;
                } else if (!textPrompt && attachmentToSend) {
                    compactUserText = "[User submitted a visual query]";
                }

                chatHistory.push({ role: "user", content: compactUserText });
                chatHistory.push({ role: "model", content: aiResponseText });

                if (chatHistory.length > 30) {
                    chatHistory = chatHistory.slice(-30);
                }
            } else {
                throw new Error("Empty response received from Gemini model.");
            }
        } catch (error) {
            removeLoader();
            console.error("API Call Error:", error);
            addMessageToUI("agent", `⚠️ **Error occurred while processing request:**\n${error.message}\n\nKripya check karein ki aapka API key sahi hai ya nahi.`);
        }
    }

    sendBtn.addEventListener("click", sendMessage);

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 10. Resource Inquiry Form Submission handler logic
    inquiryForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Get Form Data details
        const name = document.getElementById("form-name").value;
        const email = document.getElementById("form-email").value;
        const college = document.getElementById("form-college").value;
        const branch = document.getElementById("form-branch").value;
        const category = document.getElementById("form-category").value;
        const subject = document.getElementById("form-subject").value;
        const message = document.getElementById("form-message").value;

        const newInquiry = {
            id: "inq_" + Date.now().toString(),
            timestamp: new Date().toLocaleString(),
            name: name,
            email: email,
            college: college || "N/A",
            branch: branch || "N/A",
            category: category,
            subject: subject || "N/A",
            message: message
        };

        // Load existing items, edit, push to chrome.storage
        chrome.storage.local.get(["whatinInquiries"], (result) => {
            const currentList = result.whatinInquiries || [];
            currentList.push(newInquiry);

            chrome.storage.local.set({ whatinInquiries: currentList }, () => {
                // Toggle view states to show success widget details
                inquiryForm.classList.add("hidden");
                inquiryHeader.classList.add("hidden");
                successWidget.classList.remove("hidden");
            });
        });
    });

    // Reset form views trigger
    successResetBtn.addEventListener("click", () => {
        // Reset fields
        inquiryForm.reset();

        // Toggle views visibility properties
        successWidget.classList.add("hidden");
        inquiryForm.classList.remove("hidden");
        inquiryHeader.classList.remove("hidden");
    });
});
