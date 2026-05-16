document.addEventListener("DOMContentLoaded", () => {
 
    // ── 1. LOGIN CHECK ────────────────────────────────────────
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "../html/login.html";
        return;
    }
 
    // ── 2. LOAD DATA ──────────────────────────────────────────
 
    // availability.js saves: [{day:"Monday", start:"08:00", end:"11:00"}, ...]
    const rawAvailability = JSON.parse(
        localStorage.getItem(`availability_${currentUser.id}`)
    ) || [];
 
    const studyProgress = JSON.parse(
        localStorage.getItem(`progress_${currentUser.id}`)
    ) || { completedSessions: [], missedSessions: [] };
 
    if (!studyProgress.missedSessions) studyProgress.missedSessions = [];
 
    const deadlines = JSON.parse(
        localStorage.getItem(`deadlines_${currentUser.id}`)
    ) || [];
 
    // ── 3. CONVERT AVAILABILITY → SLOT MAP ───────────────────
   
    function buildAvailabilityMap(raw) {
        const map = {};
        raw.forEach(entry => {
            const startH = parseInt(entry.start.split(":")[0], 10);
            const endH   = parseInt(entry.end.split(":")[0], 10);
            const slots  = [];
            for (let h = startH; h < endH; h++)
                slots.push(h.toString().padStart(2, "0") + ":00");
            if (slots.length > 0) map[entry.day] = slots;
        });
        return map;
    }
 
    const availabilityMap = buildAvailabilityMap(rawAvailability);
 
    // ── 4. CALCULATE TOTALS ───────────────────────────────────
    const daysOfWeek = [
        "Sunday","Monday","Tuesday","Wednesday",
        "Thursday","Friday","Saturday"
    ];
 
    // FR8.1 — total study hours = total slots across all days
    let totalSessions   = 0;
    let totalStudyHours = 0;
    const weeklySlotsByDay = {};
 
    daysOfWeek.forEach(day => {
        const slots            = availabilityMap[day] || [];
        weeklySlotsByDay[day]  = slots.length;
        totalSessions         += slots.length;
        totalStudyHours       += slots.length; // each slot = 1 hour
    });
 
    // FR6.2 — completed/missed from studyProgress (synced with studyplan)
    const completed = studyProgress.completedSessions.length;
    const missed    = studyProgress.missedSessions.length;
    const pending   = Math.max(0, totalSessions - completed - missed);
 
    // ── 5. PIE CHART PERCENTAGES ──────────────────────────────
    const completedPct = totalSessions > 0
        ? Math.floor((completed / totalSessions) * 100) : 0;
    const missedPct = totalSessions > 0
        ? Math.floor((missed / totalSessions) * 100) : 0;
 
    // ── 6. DOM ELEMENTS ───────────────────────────────────────
    const progressPercentEl = document.getElementById("progressPercent");
    const completedInfoEl   = document.getElementById("completedInfo");
    const pendingInfoEl     = document.getElementById("pendingInfo");
    const missedInfoEl      = document.getElementById("missedInfo");
    const recentActivityEl  = document.getElementById("recentActivity");
    const completedTasksEl  = document.getElementById("completedTasks");
    const pendingTasksEl    = document.getElementById("pendingTasks");
    const missedTasksEl     = document.getElementById("missedTasks");
    const studyHoursEl      = document.getElementById("studyHours");
    const pieChartEl        = document.getElementById("pieChart");
    const weeklyChartEl     = document.getElementById("weeklyChart");
 
    // ── 7. PIE CHART ──────────────────────────────────────────
    if (progressPercentEl) progressPercentEl.innerText = `${completedPct}%`;
 
    if (pieChartEl) {
        const c = completedPct;
        const m = c + missedPct;
        pieChartEl.style.background = `
    conic-gradient(
        #7FBF9A 0% ${c}%,
        #D9788F ${c}% ${m}%,
        #8A6FC7  ${m}% 100%
    )
    `;
    }
 
    // ── 8. LEGEND ─────────────────────────────────────────────
    if (completedInfoEl) completedInfoEl.innerHTML = `
        <span class="box green"></span>
        <img src="../imgs/success.png" class="mini-icon" alt="">
        Completed (${completed})
    `;
    if (pendingInfoEl) pendingInfoEl.innerHTML = `
        <span class="box blue"></span>
        <img src="../imgs/hourglass.png" class="mini-icon" alt="">
        Pending (${pending})
    `;
    if (missedInfoEl) missedInfoEl.innerHTML = `
        <span class="box red"></span>
        <img src="../imgs/warningRed.png" class="mini-icon" alt="">
        Missed (${missed})
    `;
 
    // ── 9. RECENT ACTIVITY ────────────────────────────────────
    if (recentActivityEl) {
        recentActivityEl.innerHTML = "";
 
        const recentDone   = [...studyProgress.completedSessions].reverse().slice(0, 3);
        const recentMissed = [...studyProgress.missedSessions].reverse().slice(0, 2);
 
        recentDone.forEach(id => {
            recentActivityEl.innerHTML += `
                <div class="activity">
                    <p><strong>📚 ${id.replace('-', ' — ')}</strong></p>
                    <p><img src="../imgs/checkMark.png" class="mini-icon" alt=""> Completed</p>
                </div>
            `;
        });
 
        recentMissed.forEach(id => {
            recentActivityEl.innerHTML += `
                <div class="activity">
                    <p><strong>📚 ${id.replace('-', ' — ')}</strong></p>
                    <p><img src="../imgs/warningRed.png" class="mini-icon" alt=""> Missed</p>
                </div>
            `;
        });
 
        if (!recentDone.length && !recentMissed.length) {
            recentActivityEl.innerHTML = `
                <p style="color:#aaa; text-align:center; padding:1em 0;">
                    No activity yet. Start completing sessions in your Study Plan!
                </p>
            `;
        }
    }
 
    // ── 10. SUMMARY ───────────────────────────────────────────
    if (completedTasksEl)
        completedTasksEl.innerHTML =
            `<img src="../imgs/checkMark.png" class="mini-icon" alt=""> Completed Sessions: ${completed}`;
 
    if (pendingTasksEl)
        pendingTasksEl.innerHTML =
            `<img src="../imgs/hourglass.png" class="mini-icon" alt=""> Pending Sessions: ${pending}`;
 
    if (missedTasksEl)
        missedTasksEl.innerHTML =
            `<img src="../imgs/warningRed.png" class="mini-icon" alt=""> Missed Sessions: ${missed}`;
 
    if (studyHoursEl)
        studyHoursEl.innerHTML =
            `<img src="../imgs/clock.png" class="mini-icon" alt=""> Weekly Study Hours: ${totalStudyHours}h`;
 
    // ── 11. FR8.2 — WEEKLY BAR CHART ─────────────────────────
    if (weeklyChartEl) {
        const activeDays = daysOfWeek.filter(d => weeklySlotsByDay[d] > 0);
        const maxSlots   = Math.max(...activeDays.map(d => weeklySlotsByDay[d]), 1);
 
        if (activeDays.length === 0) {
            weeklyChartEl.innerHTML = `
                <h2 style="margin-bottom:12px;">
                    <img src="../imgs/graph.png" class="section-icon" alt=""> Weekly Study Trend
                </h2>
                <p style="color:#aaa; text-align:center;">
                    No availability set yet.
                    <a href="availability.html">Set your schedule →</a>
                </p>
            `;
        } else {
            weeklyChartEl.innerHTML = `
                <h2 style="margin-bottom:16px;">
                    <img src="../imgs/graph.png" class="section-icon" alt=""> Weekly Study Trend
                </h2>
                <div class="bar-chart">
                    ${activeDays.map(day => {
                        const total     = weeklySlotsByDay[day];
                        const doneCount = studyProgress.completedSessions
                            .filter(s => s.startsWith(day + "-")).length;
                        const missCount = studyProgress.missedSessions
                            .filter(s => s.startsWith(day + "-")).length;
 
                        const donePct  = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                        const missPct  = total > 0 ? Math.round((missCount / total) * 100) : 0;
                        const pendPct  = Math.max(0, 100 - donePct - missPct);
                        const barH     = Math.round((total / maxSlots) * 120); // max 120px
 
                        return `
                            <div class="bar-group">
                                <div class="bar-wrap" style="height:${barH}px">
                                    <div class="bar-segment bar-pending"
                                         style="height:${pendPct}%"></div>
                                    <div class="bar-segment bar-missed"
                                         style="height:${missPct}%"></div>
                                    <div class="bar-segment bar-done"
                                         style="height:${donePct}%"></div>
                                </div>
                                <span class="bar-label">${day.slice(0, 3)}</span>
                                <span class="bar-hours">${total}h</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="chart-legend">
                    <span><span class="legend-dot" style="background:#7FBF9A"></span> Done</span>
                    <span><span class="legend-dot" style="background:#D9788F"></span> Missed</span>
                    <span><span class="legend-dot" style="background:#8A6FC7"></span> Pending</span>
                </div>
            `;
        }
    }
 
});