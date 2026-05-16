/* =========================
   DASHBOARD SCRIPT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
       WELCOME MESSAGE
    ========================= */

  const welcomeText = document.getElementById("welcomeText");

  const hour = new Date().getHours();

  let greeting = "";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  welcomeText.innerHTML = `${greeting}, ${currentUser.fullName} <img src="../imgs/wavingHand.png" alt="waving hand" class="wave-icon">`;
  /* =========================
       STATISTICS
    ========================= */

  const totalHours = 18;

  const completedSessions = 12;

  const focusRate = 78;

  const productivity = 85;

  /* Display Statistics */

  document.getElementById("hoursNumber").innerText = totalHours;

  document.getElementById("sessionsNumber").innerText = completedSessions;

  document.getElementById("focusNumber").innerText = `${focusRate}%`;

  document.getElementById("productivityNumber").innerText = `${productivity}%`;

  /* =========================
       WEEKLY PROGRESS
    ========================= */

  const weeklyProgress = 75;

  document.getElementById("progressText").innerText = `${weeklyProgress}%`;

  /* =========================
       STUDY HOURS
    ========================= */

  const studyHours = [
    {
      day: "Sunday",
      hours: 2,
    },

    {
      day: "Monday",
      hours: 3,
    },

    {
      day: "Tuesday",
      hours: 4,
    },

    {
      day: "Wednesday",
      hours: 5,
    },

    {
      day: "Thursday",
      hours: 4,
    },
  ];

  const studyStats = document.getElementById("studyStats");

  studyHours.forEach((item) => {
    studyStats.innerHTML += `

        <p>
            <img src="../imgs/books.png" class="mini-icon" alt=""> ${item.day} :
            ${item.hours} hours
        </p>

    `;
  });

  /* =========================
       AI STUDY TIPS
    ========================= */

  const tips = [
    "Study in short focused sessions.",

    "Review notes before sleeping.",

    "Practice active recall daily.",

    "Take breaks every 25 minutes.",

    "Solve exercises instead of rereading.",

    "Stay hydrated while studying.",

    "Use flashcards to improve memory.",

    "Study difficult subjects first.",
  ];

  const tipBtn = document.getElementById("tipBtn");

  const tipText = document.getElementById("tipText");

  tipBtn.addEventListener("click", () => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    tipText.innerText = randomTip;
  });

  /* =========================
       CARD ANIMATION
    ========================= */

  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-5px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0px)";
    });
  });
});

/* =========================
   GEMINI AI CHATBOT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");

  const userInput = document.getElementById("userInput");

  const chatBox = document.getElementById("chatBox");

  const openChatBtn = document.getElementById("openChatBtn");

  const aiWindow = document.getElementById("aiWindow");

  const closeChatBtn = document.getElementById("closeChatBtn");

  const API_KEY = "AIzaSyDWeCLXT3r5T-v0wuqrqp9OyQQaRGBHnzs";

  /* OPEN CHAT */

  openChatBtn.addEventListener("click", () => {
    aiWindow.style.display = "flex";
  });

  /* CLOSE CHAT */

  closeChatBtn.addEventListener("click", () => {
    aiWindow.style.display = "none";
  });

  /* SEND MESSAGE */

  sendBtn.addEventListener("click", async () => {
    const userMessage = userInput.value.trim();

    if (userMessage === "") return;

    /* USER MESSAGE */

    chatBox.innerHTML += `
      <div class="user-message">
        ${userMessage}
      </div>
    `;

    userInput.value = "";

    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent:generateContent?key=${API_KEY}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
                    You are a smart study assistant.
                    Keep answers short, clean, and helpful.

                    User:
                    ${userMessage}
                    `,
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();
      console.log(data);
      const aiReply = data.candidates[0].content.parts[0].text;

      /* AI MESSAGE */

      chatBox.innerHTML += `
        <div class="ai-message">
          ${aiReply}
        </div>
      `;

      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
      chatBox.innerHTML += `
        <div class="ai-message">
          ⚠️ Error connecting to Gemini AI.
        </div>
      `;
    }
  });
});
