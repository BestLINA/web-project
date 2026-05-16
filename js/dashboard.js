document.addEventListener("DOMContentLoaded", () => {
    
    // Check if user is logged in safely
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "../html/login.html";
        return;
    }

    /* ==========================================
       WELCOME MESSAGE GREETING
       ========================================== */
    const welcomeText = document.getElementById("welcomeText");
    const hour = new Date().getHours();
    let greeting = "Good Evening";

    if (hour < 12) {
        greeting = "Good Morning";
    } else if (hour < 18) {
        greeting = "Good Afternoon";
    }

    if (welcomeText) {
        welcomeText.innerHTML = `${greeting}, ${currentUser.fullName} <img src="../imgs/wavingHand.png" alt="waving hand" class="wave-icon">`;
    }

    /* ==========================================
       DYNAMIC SYNCHRONIZATION WITH PROGRESS DATA
       ========================================== */
    const rawAvailability = JSON.parse(localStorage.getItem(`availability_${currentUser.id}`)) || [];
    const studyProgress = JSON.parse(localStorage.getItem(`progress_${currentUser.id}`)) || { completedSessions: [], missedSessions: [] };
    
    if (!studyProgress.missedSessions) {
        studyProgress.missedSessions = [];
    }

    // Build map structure of hours slots per active days
    const availabilityMap = {};
    rawAvailability.forEach(entry => {
        const startH = parseInt(entry.start.split(":")[0], 10);
        const endH   = parseInt(entry.end.split(":")[0], 10);
        const slots  = [];
        for (let h = startH; h < endH; h++) {
            slots.push(h.toString().padStart(2, "0") + ":00");
        }
        if (slots.length > 0) {
            availabilityMap[entry.day] = slots;
        }
    });

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let totalSessions = 0;
    const weeklyHoursArray = [];

    daysOfWeek.forEach(day => {
        const hoursCount = availabilityMap[day] ? availabilityMap[day].length : 0;
        totalSessions += hoursCount;
        if (hoursCount > 0) {
            weeklyHoursArray.push({ day: day, hours: hoursCount });
        }
    });

    const completed = studyProgress.completedSessions.length;
    const missed = studyProgress.missedSessions.length;

    // Calculate percentage rates out of total generated slots
    const progressPercent = totalSessions > 0 ? Math.floor((completed / totalSessions) * 100) : 0;
    
    // Productivity calculation formulation variants for UI metrics display
    const focusRate = totalSessions > 0 ? Math.round(((completed) / (completed + missed || 1)) * 100) : 0;
    const productivityScore = progressPercent; 

    // Render calculated metric numbers cleanly to elements
    document.getElementById("hoursNumber").innerText = totalSessions;
    document.getElementById("sessionsNumber").innerText = completed;
    document.getElementById("focusNumber").innerText = `${totalSessions > 0 ? focusRate : 0}%`;
    document.getElementById("productivityNumber").innerText = `${productivityScore}%`;

    /* ==========================================
       PROGRESS CIRCLE RENDERING
       ========================================== */
    const progressTextEl = document.getElementById("progressText");
    if (progressTextEl) {
        progressTextEl.innerText = `${progressPercent}%`;
    }

    // Update circular progress via conical gradient masking dynamically
    const progressCircle = document.getElementById("dashboardProgressCircle");
    if (progressCircle) {
        progressCircle.style.background = `conic-gradient(#22c55e 0% ${progressPercent}%, #e2e8f0 ${progressPercent}% 100%)`;
    }

    /* ==========================================
       WEEKLY STUDY HOURS TRACKER
       ========================================== */
    const studyStats = document.getElementById("studyStats");
    if (studyStats) {
        studyStats.innerHTML = "";
        if (weeklyHoursArray.length === 0) {
            studyStats.innerHTML = `<p style="color:#aaa;">No availability configurations submitted yet.</p>`;
        } else {
            weeklyHoursArray.forEach(item => {
                studyStats.innerHTML += `
                    <p>
                        <img src="../imgs/books.png" class="mini-icon" alt=""> ${item.day} : ${item.hours} hours
                    </p>
                `;
            });
        }
    }

    /* ==========================================
       HOVER EFFECT CARDS ANIMATIONS
       ========================================== */
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-5px)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0px)";
        });
    });
});

/* ==========================================
   GEMINI AI BOT FETCH & VALIDATION LOGIC
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const openChatBtn = document.getElementById("openChatBtn");
    const aiWindow = document.getElementById("aiWindow");
    const closeChatBtn = document.getElementById("closeChatBtn");

    const API_KEY = "AIzaSyBCOGvtuTuQkJPHVjiABvjJT7mWeUexk4E";

    if (openChatBtn && aiWindow) {
        openChatBtn.addEventListener("click", () => {
            aiWindow.style.display = "flex";
        });
    }

    if (closeChatBtn && aiWindow) {
        closeChatBtn.addEventListener("click", () => {
            aiWindow.style.display = "none";
        });
    }

    if (sendBtn && userInput && chatBox) {
        sendBtn.addEventListener("click", async () => {
            const userMessage = userInput.value.trim();

            // Input Validation - stops processing empty values
            if (userMessage === "") {
                return;
            }

            chatBox.innerHTML += `
                <div class="user-message">
                    ${userMessage}
                </div>
            `;

            userInput.value = "";
            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": API_KEY
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: `You are a helpful study assistant for university students. Keep answers short and helpful. User: ${userMessage}`
                                        }
                                    ]
                                }
                            ]
                        })
                    }
                );

                const data = await response.json();
                
                if (data && data.candidates && data.candidates[0].content.parts[0].text) {
                    const aiReply = data.candidates[0].content.parts[0].text;
                    chatBox.innerHTML += `
                        <div class="ai-message">
                            ${aiReply}
                        </div>
                    `;
                } else {
                    throw new Error("Invalid response schema layout");
                }

                chatBox.scrollTop = chatBox.scrollHeight;

            } catch (error) {
                chatBox.innerHTML += `
                    <div class="ai-message">
                        ⚠️ Error connecting to Gemini AI.
                    </div>
                `;
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        });
    }
});