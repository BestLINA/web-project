
// check if user is logged in
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
    window.location.href = "../html/login.html";
}

// storage keys
const deadlinesKey = "deadlines_" + currentUser.id;
const availabilityKey = "availability_" + currentUser.id;
const readKey = "readReminders_" + currentUser.id;

// load data
const deadlines = JSON.parse(localStorage.getItem(deadlinesKey)) || [];
const availability = JSON.parse(localStorage.getItem(availabilityKey)) || [];
let readIds = JSON.parse(localStorage.getItem(readKey)) || [];


// =========================================
//   STEP 1 — print today's date at top
// =========================================

const todayDateEl = document.getElementById("todayDate");

const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
};

// format: "Saturday, 16 May 2026"
todayDateEl.textContent = new Date().toLocaleDateString("en-GB", dateOptions);

// =========================================
//   STEP 2 — get today and tomorrow
//            day names for availability
// =========================================

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const todayIndex = new Date().getDay();
const tomorrowIndex = (todayIndex + 1) % 7;

const todayName = dayNames[todayIndex];
const tomorrowName = dayNames[tomorrowIndex];

// =========================================
//   STEP 3 — helper to calculate days left
// =========================================

function getDaysLeft(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// =========================================
//   STEP 4 — generate reminders array
//            from deadlines and availability
// =========================================

function generateReminders() {
    const reminders = [];

    // --- deadline reminders ---
    deadlines.forEach(item => {

        // skip completed deadlines
        if (item.completed) return;

        const daysLeft = getDaysLeft(item.date);

        // skip if more than 3 days away
        if (daysLeft > 3) return;

        let img = "";
        let text = "";
        let sub = "Due on " + item.date;

        // build unique id for this reminder
        const id = "deadline-" + item.course + "-" + item.title + "-" + item.date;

        if (daysLeft < 0) {
            img = "../imgs/warningRed.png";
            text = item.course + " — " + item.title + " is overdue";
            sub = "Was due on " + item.date;
        } else if (daysLeft === 0) {
            img = "../imgs/warningRed.png";
            text = item.course + " — " + item.title + " is due today";
        } else if (daysLeft === 1) {
            img = "../imgs/warning.png";
            text = item.course + " — " + item.title + " is due tomorrow";
        } else {
            img = "../imgs/hourglass.png";
            text = item.course + " — " + item.title + " due in " + daysLeft + " days";
        }

        reminders.push({ id, img, text, sub });
    });

    // --- availability / study session reminders ---
    availability.forEach(entry => {

        const day = entry.day;

        // only show today and tomorrow sessions
        if (day !== todayName && day !== tomorrowName) return;

        const isToday = day === todayName;

        const id = "session-" + day.toLowerCase() + "-" + new Date().toISOString().split("T")[0];
        const img = isToday ? "../imgs/clock.png" : "../imgs/pin.png";
        const text = isToday
            ? "You have a study session today"
            : "You have a study session tomorrow";
        const sub = day + " · " + entry.start + " – " + entry.end;

        reminders.push({ id, img, text, sub });
    });

    return reminders;
}

// =========================================
//   STEP 5 — render the page
// =========================================

function render() {

    const reminders = generateReminders();

    // separate unread and read
    const unread = reminders.filter(r => !readIds.includes(r.id));
    const read = reminders.filter(r => readIds.includes(r.id));

    // get containers
    const unreadContainer = document.getElementById("unreadContainer");
    const readContainer = document.getElementById("readContainer");
    const emptyState = document.getElementById("emptyState");
    const unreadSection = document.getElementById("unreadSection");
    const readSection = document.getElementById("readSection");
    const unreadCount = document.getElementById("unreadCount");

    // clear old content
    unreadContainer.innerHTML = "";
    readContainer.innerHTML = "";

    // no reminders at all
    if (reminders.length === 0) {
        emptyState.style.display = "block";
        unreadSection.style.display = "none";
        readSection.style.display = "none";
        updateBellDot(0);
        return;
    }

    emptyState.style.display = "none";

    // --- render unread ---
    unreadCount.textContent = unread.length;

    if (unread.length === 0) {
        unreadContainer.innerHTML = `
            <p class="reminders-empty-sub">All caught up! No new reminders.</p>
        `;
    } else {
        unread.forEach(reminder => {
            const card = createCard(reminder, false);
            unreadContainer.appendChild(card);
        });
    }

    // --- render read ---
    if (read.length === 0) {
        readSection.style.display = "none";
    } else {
        readSection.style.display = "block";
        read.forEach(reminder => {
            const card = createCard(reminder, true);
            readContainer.appendChild(card);
        });
    }

    // update bell dot
    updateBellDot(unread.length);
}

// =========================================
//   STEP 6 — create a reminder card
// =========================================

function createCard(reminder, isRead) {

    const card = document.createElement("div");
    card.className = "reminder-item" + (isRead ? " reminder-read" : "");

    card.innerHTML = `
        <div class="reminder-left">
            <img src="${isRead ? "../imgs/checkMark.png" : reminder.img}" class="reminder-icon" alt="reminder icon">
            <div class="reminder-text">
                <div class="reminder-title">${reminder.text}</div>
                <div class="reminder-course">${reminder.sub}</div>
            </div>
        </div>
    `;

    // clicking an unread card marks it as read
    if (!isRead) {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            if (!readIds.includes(reminder.id)) {
                readIds.push(reminder.id);
                localStorage.setItem(readKey, JSON.stringify(readIds));
            }
            render();
        });
    }

    return card;
}

// =========================================
//   STEP 7 — update the red dot on bell
// =========================================

function updateBellDot(unreadCount) {
    const dot = document.getElementById("notifDot");
    if (!dot) return;

    if (unreadCount > 0) {
        dot.classList.add("notif-dot-visible");
    } else {
        dot.classList.remove("notif-dot-visible");
    }
}

// =========================================
//   INITIAL RUN
// =========================================
// remove old ids that no longer have an active reminder
const validIds = generateReminders().map(r => r.id);
readIds = readIds.filter(id => validIds.includes(id));
localStorage.setItem(readKey, JSON.stringify(readIds));

render();