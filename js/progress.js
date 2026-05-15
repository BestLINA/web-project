// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Kick unauthorized users out back to login immediately
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "../html/login.html";
        return;
    }

    // DOM Elements
    const themeButton = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const siteLogo = document.getElementById("siteLogo");
    const notificationLink = document.getElementById("notifLink");

    // Unified helper to check if dark class is active on body
    function isDarkMode() {
        return document.body.classList.contains("dark");
    }

    // Switch image assets dynamically based on current theme state
    function updateThemeAssets() {
        if (isDarkMode()) {
            if (themeIcon) themeIcon.src = "../imgs/Sun.png";
            if (siteLogo) siteLogo.src = "../imgs/AWJ_logo_pink.png";
        } else {
            if (themeIcon) themeIcon.src = "../imgs/Moon.png";
            if (siteLogo) siteLogo.src = "../imgs/AWJ_logo.png";
        }
    }

    // Sync theme settings with global key used across all project files
    function loadSavedTheme() {
        const savedTheme = localStorage.getItem("awj_dark_mode");

        if (savedTheme === "enabled") {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
        updateThemeAssets();
    }

    // Toggle theme and update persistent storage tracking state
    function toggleTheme() {
        document.body.classList.toggle("dark");
        
        if (isDarkMode()) {
            localStorage.setItem("awj_dark_mode", "enabled");
        } else {
            localStorage.setItem("awj_dark_mode", "disabled");
        }
        updateThemeAssets();
    }

    // Handle smart notification navigation paths
    function handleNotificationNavigation(event) {
        const currentPage = window.location.pathname;

        if (currentPage.includes("html/Reminders.html")) {
            event.preventDefault();
            window.location.href = "../html/dashboard.html";
        }
    }

    // Highlight the active menu item inside sidebar component navigation
    function activateCurrentMenuItem() {
        const links = document.querySelectorAll(".sidebar .menu a");
        links.forEach((link) => {
            const linkFile = link.getAttribute("href");
            
            // Strictly highlight progress page on this view
            if (linkFile === "progress.html") {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    // Trigger visual entry animations for the loaded progress cards
    function animateProgressCards() {
        window.requestAnimationFrame(() => {
            document.body.classList.add("ready");
        });
    }

    // Fire initialization setup routines
    loadSavedTheme();
    activateCurrentMenuItem();
    animateProgressCards();

    // Event Listeners bind setup
    if (themeButton) {
        themeButton.addEventListener("click", toggleTheme);
    }

    if (notificationLink) {
        notificationLink.addEventListener("click", handleNotificationNavigation);
    }
});