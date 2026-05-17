document.addEventListener("DOMContentLoaded", () => {

    // ── 1. LOGIN CHECK ────────────────────────────────────────
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "../html/login.html";
        return;
    }

    // ── 2. LOAD DATA FROM STORAGE ─────────────────────────────
    const rawAvailability = JSON.parse(
        localStorage.getItem(`availability_${currentUser.id}`)
    ) || [];

    const studyProgress = JSON.parse(
        localStorage.getItem(`progress_${currentUser.id}`)
    ) || { completedSessions: [], missedSessions: [] };

    if (!studyProgress.missedSessions) studyProgress.missedSessions = [];

    // ── 3. CONVERT AVAILABILITY TO SLOT MAP ───────────────────
    function buildAvailabilityMap(raw) {
        const map = {};
        raw.forEach(entry => {
            const startH = parseInt(entry.start.split(":")[0], 10);
            const endH = parseInt(entry.end.split(":")[0], 10);
            const slots = [];
            for (let h = startH; h < endH; h++)
                slots.push(h.toString().padStart(2, "0") + ":00");
            if (slots.length > 0) map[entry.day] = slots;
        });
        return map;
    }

    const availabilityMap = buildAvailabilityMap(rawAvailability);

    // ── 4. CALCULATE TIMELINE TOTALS ──────────────────────────
    const daysOfWeek = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    let totalSessions = 0;
    let totalStudyHours = 0;
    const weeklySlotsByDay = {};

    daysOfWeek.forEach(day => {
        const slots = availabilityMap[day] || [];
        weeklySlotsByDay[day] = slots.length;
        totalSessions += slots.length;
        totalStudyHours += slots.length; 
    });

    // Compute metric breakdowns for both flat string fallbacks and dynamic session objects
    const completed = studyProgress.completedSessions.length;
    const missed = studyProgress.missedSessions.length;
    const pending = Math.max(0, totalSessions - completed - missed);

    // ── 5. PIE CHART RATIOS ───────────────────────────────────
    const completedPct = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;
    const missedPct = totalSessions > 0 ? Math.round((missed / totalSessions) * 100) : 0;
    const pendingPct = totalSessions > 0 ? Math.max(0, 100 - completedPct - missedPct) : 0;

    // ── 6. CACHE DOM ELEMENTS ─────────────────────────────────
    const progressPercentEl = document.getElementById("progressPercent");
    const completedInfoEl = document.getElementById("completedInfo");
    const pendingInfoEl = document.getElementById("pendingInfo");
    const missedInfoEl = document.getElementById("missedInfo");
    const recentActivityEl = document.getElementById("recentActivity");
    const completedTasksEl = document.getElementById("completedTasks");
    const pendingTasksEl = document.getElementById("pendingTasks");
    const missedTasksEl = document.getElementById("missedTasks");
    const studyHoursEl = document.getElementById("studyHours");
    const pieChartEl = document.getElementById("pieChart");
    const weeklyChartEl = document.getElementById("weeklyChart");

    if (progressPercentEl) {
        progressPercentEl.innerText = `${completedPct}%`;
    }

    // ── 7. RENDER PIE CHART BACKGROUND ────────────────────────
    if (pieChartEl) {
        if (totalSessions === 0) {
            pieChartEl.style.background = "#eadcf2";
        } else {
            const c = completedPct;
            const m = c + missedPct;
            pieChartEl.style.background = `conic-gradient(
                #7FBF9A 0% ${c}%,
                #D9788F ${c}% ${m}%,
                #8A6FC7 ${m}% 100%
            )`;
        }
    }

    // ── 8. RENDER CHART LEGEND WITH ACCESSIBLE ALT TEXT ───────
    if (completedInfoEl) completedInfoEl.innerHTML = `
        <span class="box green" style="background-color: #7FBF9A;"></span>
        <img src="../imgs/success.png" class="mini-icon" alt="Success icon">
        Completed: ${completed} (${completedPct}%)
    `;
    if (pendingInfoEl) pendingInfoEl.innerHTML = `
        <span class="box blue" style="background-color: #8A6FC7;"></span>
        <img src="../imgs/hourglass.png" class="mini-icon" alt="Hourglass pending icon">
        Pending: ${pending} (${pendingPct}%)
    `;
    if (missedInfoEl) missedInfoEl.innerHTML = `
        <span class="box red" style="background-color: #D9788F;"></span>
        <img src="../imgs/warningRed.png" class="mini-icon" alt="Error warning icon">
        Missed: ${missed} (${missedPct}%)
    `;

    // ── 9. GENERATE RECENT ACTIVITY LOG ───────────────────────
    if (recentActivityEl) {
        recentActivityEl.innerHTML = "";
        
        const recentDone = [...studyProgress.completedSessions].reverse().slice(0, 3);
        const recentMissed = [...studyProgress.missedSessions].reverse().slice(0, 2);

        recentDone.forEach(session => {
            const sId = (session && session.id) ? session.id : session;
            const sCourse = (session && session.course) ? ` [${session.course}]` : "";
            
            if (sId) {
                recentActivityEl.innerHTML += `
                    <div class="activity">
                        <p><strong>📚 ${sId.replace('-', ' — ')}${sCourse}</strong></p>
                        <p><img src="../imgs/checkMark.png" class="mini-icon" alt="Checked checkmark icon"> Completed</p>
                    </div>
                `;
            }
        });

        recentMissed.forEach(session => {
            const sId = (session && session.id) ? session.id : session;
            const sCourse = (session && session.course) ? ` [${session.course}]` : "";
            
            if (sId) {
                recentActivityEl.innerHTML += `
                    <div class="activity">
                        <p><strong>📚 ${sId.replace('-', ' — ')}${sCourse}</strong></p>
                        <p><img src="../imgs/warningRed.png" class="mini-icon" alt="Red warning icon"> Missed</p>
                    </div>
                `;
            }
        });

        if (!recentDone.length && !recentMissed.length) {
            recentActivityEl.innerHTML = `
                <p style="color:#aaa; text-align:center; padding:1em 0;">
                    No activity yet. Start completing sessions in your Study Plan!
                </p>
            `;
        }
    }

    // ── 10. RENDER TOTALS SUMMARY CONTAINER ───────────────────
    if (completedTasksEl)
        completedTasksEl.innerHTML = `<img src="../imgs/checkMark.png" class="mini-icon" alt="Checked checkmark icon"> Completed Sessions: ${completed} (${completedPct}%)`;

    if (pendingTasksEl)
        pendingTasksEl.innerHTML = `<img src="../imgs/hourglass.png" class="mini-icon" alt="Hourglass pending icon"> Pending Sessions: ${pending} (${pendingPct}%)`;

    if (missedTasksEl)
        missedTasksEl.innerHTML = `<img src="../imgs/warningRed.png" class="mini-icon" alt="Red warning icon"> Missed Sessions: ${missed} (${missedPct}%)`;

    if (studyHoursEl)
        studyHoursEl.innerHTML = `<img src="../imgs/clock.png" class="mini-icon" alt="Clock layout icon"> Weekly Study Hours: ${totalStudyHours}h`;

    // ── 11. RENDER WEEKLY BAR CHART PROGRESS TREND ────────────
    if (weeklyChartEl) {
        const activeDays = daysOfWeek.filter(d => weeklySlotsByDay[d] > 0);
        const maxSlots = Math.max(...activeDays.map(d => weeklySlotsByDay[d]), 1);

        if (activeDays.length === 0) {
            weeklyChartEl.innerHTML = `
                <h2 style="margin-bottom:12px;">
                    <img src="../imgs/graph.png" class="section-icon" alt="Trend analytics chart icon"> Weekly Study Trend
                </h2>
                <p style="color:#aaa; text-align:center;">
                    No availability set yet. <a href="availability.html">Set your schedule →</a>
                </p>
            `;
        } else {
            weeklyChartEl.innerHTML = `
                <h2 style="margin-bottom:16px;">
                    <img src="../imgs/graph.png" class="section-icon" alt="Trend analytics chart icon"> Weekly Study Trend
                </h2>
                <div class="bar-chart">
                    ${activeDays.map(day => {
                        const total = weeklySlotsByDay[day];
                        
                        const doneCount = studyProgress.completedSessions.filter(s => {
                            const id = (s && s.id) ? s.id : s;
                            return id && typeof id === 'string' && id.startsWith(day + "-");
                        }).length;

                        const missCount = studyProgress.missedSessions.filter(s => {
                            const id = (s && s.id) ? s.id : s;
                            return id && typeof id === 'string' && id.startsWith(day + "-");
                        }).length;

                        const donePct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                        const missPct = total > 0 ? Math.round((missCount / total) * 100) : 0;
                        const pendPct = Math.max(0, 100 - donePct - missPct);
                        const barH = Math.round((total / maxSlots) * 120);

                        return `
                            <div class="bar-group">
                                <div class="bar-wrap" style="height:${barH}px">
                                    <div class="bar-segment bar-pending" style="height:${pendPct}%; background-color: #8A6FC7;"></div>
                                    <div class="bar-segment bar-missed" style="height:${missPct}%; background-color: #D9788F;"></div>
                                    <div class="bar-segment bar-done" style="height:${donePct}%; background-color: #7FBF9A;"></div>
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