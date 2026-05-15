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