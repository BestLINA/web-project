/* =========================
   PROGRESS SYSTEM
========================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       LOGIN CHECK
    ========================= */

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        window.location.href = "../html/login.html";
    }

    /* =========================
       STORAGE KEYS
    ========================= */

    const coursesKey =
        "courses_" + currentUser.id;

    const deadlinesKey =
        "deadlines_" + currentUser.id;

    const availabilityKey =
        "availability_" + currentUser.id;

    /* =========================
       LOAD DATA
    ========================= */

    const courses =
        JSON.parse(localStorage.getItem(coursesKey)) || [];

    const deadlines =
        JSON.parse(localStorage.getItem(deadlinesKey)) || [];

    const availability =
        JSON.parse(localStorage.getItem(availabilityKey)) || [];

    /* =========================
       ELEMENTS
    ========================= */

    const progressPercent =
        document.getElementById("progressPercent");

    const completedInfo =
        document.getElementById("completedInfo");

    const pendingInfo =
        document.getElementById("pendingInfo");

    const missedInfo =
        document.getElementById("missedInfo");

    const recentActivity =
        document.getElementById("recentActivity");

    const completedTasks =
        document.getElementById("completedTasks");

    const pendingTasks =
        document.getElementById("pendingTasks");

    const missedTasks =
        document.getElementById("missedTasks");

    const studyHours =
        document.getElementById("studyHours");

    const pieChart =
        document.getElementById("pieChart");

    /* =========================
       COUNTERS
    ========================= */

    let completed = 0;

    let pending = 0;

    let missed = 0;

    let totalStudyHours = 0;

    /* =========================
       DAYS LEFT FUNCTION
    ========================= */

    function getDaysLeft(date) {

        const today = new Date();

        const target = new Date(date);

        const diff =
            target - today;

        return Math.ceil(
            diff / (1000 * 60 * 60 * 24)
        );
    }

    /* =========================
       CALCULATE DEADLINES
    ========================= */

    deadlines.forEach(item => {

        const daysLeft =
            getDaysLeft(item.date);

        if (item.completed) {

            completed++;

        }

        else if (daysLeft < 0) {

            missed++;

        }

        else {

            pending++;

        }
    });

    /* =========================
       CALCULATE STUDY HOURS
    ========================= */

    availability.forEach(day => {

        const start =
            parseInt(day.start);

        const end =
            parseInt(day.end);

        totalStudyHours +=
            end - start;
    });

    /* =========================
       PROGRESS PERCENTAGE
    ========================= */

    const totalTasks =
        completed + pending + missed;

    let completedPercent = 0;

    if (totalTasks > 0) {

        completedPercent =
            Math.floor(
                (completed / totalTasks) * 100
            );
    }

    /* =========================
       PIE CHART
    ========================= */

    progressPercent.innerText =
        `${completedPercent}%`;

    pieChart.style.background = `

        conic-gradient(

            #22c55e 0%
            ${completedPercent}%,

            #3b82f6
            ${completedPercent}%
            ${completedPercent + 25}%,

            #facc15
            ${completedPercent + 25}% 100%

        )

    `;

    /* =========================
       OVERVIEW INFO
    ========================= */

    completedInfo.innerHTML = `
    <span class="box green"></span>
    <img src="../imgs/success.png" class="mini-icon" alt=""> Completed (${completed})
`;

    pendingInfo.innerHTML = `
    <span class="box blue"></span>
    <img src="../imgs/hourglass.png" class="mini-icon" alt=""> Pending (${pending})
`;

    missedInfo.innerHTML = `
    <span class="box yellow"></span>
    <img src="../imgs/warningRed.png" class="mini-icon" alt=""> Missed (${missed})
`;

    /* =========================
       RECENT ACTIVITY
    ========================= */

    recentActivity.innerHTML = "";

    deadlines.slice(0, 5).forEach(item => {

        let status = "";

        let icon = "";

        const daysLeft =
            getDaysLeft(item.date);

        if (item.completed) {
            status = "Completed";
            icon = `<img src="../imgs/checkMark.png" class="mini-icon" alt="">`;
        }

        else if (daysLeft < 0) {
            status = "Missed";
            icon = `<img src="../imgs/warningRed.png" class="mini-icon" alt="">`;
        }

        else {
            status = "Pending";
            icon = `<img src="../imgs/hourglass.png" class="mini-icon" alt="">`;
        }

        recentActivity.innerHTML += `

    <div class="activity">

        <p>
            <strong>
                <img src="../imgs/books.png" class="mini-icon" alt=""> ${item.title}
            </strong>
        </p>

        <p>
            ${icon} ${status}
        </p>

    </div>

`;
    });

    /* =========================
       SUMMARY
    ========================= */

    completedTasks.innerHTML =
        `<img src="../imgs/checkMark.png" class="mini-icon" alt=""> Completed Tasks: ${completed}`;

    pendingTasks.innerHTML =
        `<img src="../imgs/hourglass.png" class="mini-icon" alt=""> Pending Tasks: ${pending}`;

    missedTasks.innerHTML =
        `<img src="../imgs/warningRed.png" class="mini-icon" alt=""> Missed Tasks: ${missed}`;

    studyHours.innerHTML =
        `<img src="../imgs/clock.png" class="mini-icon" alt=""> Study Hours: ${totalStudyHours}`;

});