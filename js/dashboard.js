document.addEventListener("DOMContentLoaded", () => {
  // ── 1. LOGIN CHECK ────────────────────────────────────────
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "../html/login.html";
    return;
  }

  // ── 2. WELCOME GREETING ───────────────────────────────────
  const welcomeText = document.getElementById("welcomeText");
  const hour = new Date().getHours();
  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  }

  if (welcomeText) {
    welcomeText.innerHTML = `
            ${greeting}, ${currentUser.fullName} 
            <img src="../imgs/wavingHand.png" alt="waving hand" class="wave-icon">
        `;
  }

  // ── 3. LOAD & SYNC DATA ───────────────────────────────────
  const rawAvailability =
    JSON.parse(localStorage.getItem(`availability_${currentUser.id}`)) || [];
  const studyProgress = JSON.parse(
    localStorage.getItem(`progress_${currentUser.id}`),
  ) || { completedSessions: [], missedSessions: [] };

  if (!studyProgress.missedSessions) {
    studyProgress.missedSessions = [];
  }

  const availabilityMap = {};
  rawAvailability.forEach((entry) => {
    const startH = parseInt(entry.start.split(":")[0], 10);
    const endH = parseInt(entry.end.split(":")[0], 10);
    const slots = [];
    for (let h = startH; h < endH; h++) {
      slots.push(h.toString().padStart(2, "0") + ":00");
    }
    if (slots.length > 0) {
      availabilityMap[entry.day] = slots;
    }
  });

  // ── 4. CALCULATE METRICS ──────────────────────────────────
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let totalSessions = 0;
  const weeklyHoursArray = [];

  daysOfWeek.forEach((day) => {
    const hoursCount = availabilityMap[day] ? availabilityMap[day].length : 0;
    totalSessions += hoursCount;
    if (hoursCount > 0) {
      weeklyHoursArray.push({ day, hours: hoursCount });
    }
  });

  const completed = studyProgress.completedSessions.length;
  const missed = studyProgress.missedSessions.length;

  const progressPercent =
    totalSessions > 0 ? Math.floor((completed / totalSessions) * 100) : 0;
  const focusRate =
    totalSessions > 0
      ? Math.round((completed / (completed + missed || 1)) * 100)
      : 0;
  const productivityScore = progressPercent;

  document.getElementById("hoursNumber").innerText = totalSessions;
  document.getElementById("sessionsNumber").innerText = completed;
  document.getElementById("focusNumber").innerText = `${focusRate}%`;
  document.getElementById("productivityNumber").innerText =
    `${productivityScore}%`;

  // ── 5. PROGRESS CIRCLE ────────────────────────────────────
  const progressTextEl = document.getElementById("progressText");
  if (progressTextEl) {
    progressTextEl.innerText = `${progressPercent}%`;
  }

  const progressCircle = document.getElementById("dashboardProgressCircle");
  if (progressCircle) {
    progressCircle.style.setProperty("--progress", `${progressPercent}%`);
  }

  // ── 6. WEEKLY STUDY HOURS LIST ────────────────────────────
  const studyStats = document.getElementById("studyStats");
  if (studyStats) {
    if (weeklyHoursArray.length === 0) {
      studyStats.innerHTML = `<p class="study-stats-empty">No availability configurations submitted yet.</p>`;
    } else {
      studyStats.innerHTML = weeklyHoursArray
        .map(
          (item) => `
                    <p>
                        <img src="../imgs/books.png" class="mini-icon" alt="">
                        ${item.day} : ${item.hours} hours
                    </p>
                `,
        )
        .join("");
    }
  }
});

// ── 7. GEMINI AI CHAT MODULE ──────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  const userInput = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const openChatBtn = document.getElementById("openChatBtn");
  const aiWindow = document.getElementById("aiWindow");
  const closeChatBtn = document.getElementById("closeChatBtn");

  const API_KEY = "AIzaSyBCOGvtuTuQkJPHVjiABvjJT7mWeUexk4E";

  if (openChatBtn && aiWindow) {
    openChatBtn.addEventListener("click", () => aiWindow.classList.add("open"));
  }
  if (closeChatBtn && aiWindow) {
    closeChatBtn.addEventListener("click", () =>
      aiWindow.classList.remove("open"),
    );
  }

  function appendMessage(text, type) {
    const div = document.createElement("div");
    div.className = type === "user" ? "user-message" : "ai-message";
    const formattedText = text

      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

      .replace(/\n/g, "<br>");

    div.innerHTML = formattedText;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  if (sendBtn && userInput && chatBox) {
    const handleSendMessage = async () => {
      const userMessage = userInput.value.trim();
      if (userMessage === "") return;

      appendMessage(userMessage, "user");
      userInput.value = "";

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a helpful study assistant for university students. Keep answers short and helpful. User: ${userMessage}`,
                  },
                ],
              },
            ],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const geoError = data.error?.message || JSON.stringify(data);
          throw new Error(`API Error (${response.status}): ${geoError}`);
        }

        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiReply) {
          appendMessage(aiReply, "ai");
        } else {
          throw new Error(
            "Invalid response structure from server infrastructure",
          );
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        appendMessage(`⚠️ Connection Error: ${error.message}`, "ai");
      }
    };

    sendBtn.addEventListener("click", handleSendMessage);

    userInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleSendMessage();
      }
    });
  }
});
