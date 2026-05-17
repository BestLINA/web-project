const btn = document.getElementById("themeToggle");
const icon = document.getElementById("themeIcon");
const logo = document.getElementById("siteLogo");

function updateLogo() {
    if (document.body.classList.contains("dark")) {
        if (logo) logo.src = "../imgs/AWJ_logo_pink.png";
    } else {
        if (logo) logo.src = "../imgs/AWJ_logo.png";
    }
}

// ===== DARK AND LIGHT MODE =====
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (icon) icon.src = "../imgs/Sun.png";
}

// Run on load after applying saved theme
updateLogo();

// Toggle theme
if (btn) {
    btn.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            localStorage.setItem("theme", "dark");
            if (icon) icon.src = "../imgs/Sun.png";
        } else {
            localStorage.setItem("theme", "light");
            if (icon) icon.src = "../imgs/Moon.png";
        }

        updateLogo();
    });
}

// ===== NOTIFICATION NAVIGATION =====
const notifLink = document.getElementById("notifLink");

if (notifLink) {
    notifLink.addEventListener("click", function (e) {
        const currentPage = window.location.pathname;

        if (currentPage.includes("html/Reminders.html")) {
            e.preventDefault();
            window.location.href = "../html/dashboard.html";
        }
    });
}
// ===== RED DOT ON BELL =====
function updateNotifDot() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const readKey = "readReminders_" + currentUser.id;
    const deadlinesKey = "deadlines_" + currentUser.id;
    const availKey = "availability_" + currentUser.id;

    const deadlines = JSON.parse(localStorage.getItem(deadlinesKey)) || [];
    const availability = JSON.parse(localStorage.getItem(availKey)) || [];
    const readIds = JSON.parse(localStorage.getItem(readKey)) || [];

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[new Date().getDay()];
    const tomorrowName = dayNames[(new Date().getDay() + 1) % 7];

    let hasUnread = false;

    deadlines.forEach(item => {
        if (item.completed) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = new Date(item.date) - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days > 3) return;
        const id = "deadline-" + item.course + "-" + item.title + "-" + item.date;
        if (!readIds.includes(id)) hasUnread = true;
    });

    availability.forEach(entry => {
        if (entry.day !== todayName && entry.day !== tomorrowName) return;
        const id = "session-" + entry.day.toLowerCase() + "-" + new Date().toISOString().split("T")[0];
        if (!readIds.includes(id)) hasUnread = true;
    });

    const dot = document.getElementById("notifDot");
    if (dot) {
        if (hasUnread) dot.classList.add("notif-dot-visible");
        else dot.classList.remove("notif-dot-visible");
    }
}

updateNotifDot();
// highlight the current page in the sidebar
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const links = document.querySelectorAll(".sidebar a");
links.forEach(link => {
    if (link.getAttribute("href").toLowerCase() === currentPage) {
        link.classList.add("active");
    }
});