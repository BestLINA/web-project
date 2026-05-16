
document.addEventListener('DOMContentLoaded', () => {
 
    // ── 1. SESSION CHECK ──────────────────────────────────────
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "../html/login.html";
        return;
    }
 
    // ── 2. DOM ELEMENTS ───────────────────────────────────────
    const tableBody        = document.getElementById('tableBody');
    const tableHeaderRow   = document.getElementById('tableHeaderRow');
    const emptyState       = document.getElementById('tableEmptyState');
    const summaryContainer = document.getElementById('dynamicSummaryContent');
 
    // ── 3. LOAD RAW DATA ──────────────────────────────────────
 

    const rawAvailability = JSON.parse(
        localStorage.getItem(`availability_${currentUser.id}`)
    ) || [];
 

    const userDeadlines = JSON.parse(
        localStorage.getItem(`deadlines_${currentUser.id}`)
    ) || [];
 
   
    const userCourses = JSON.parse(
        localStorage.getItem(`courses_${currentUser.id}`)
    ) || [];
 
   
    let studyProgress = JSON.parse(
        localStorage.getItem(`progress_${currentUser.id}`)
    ) || { completedSessions: [], missedSessions: [] };
 
    if (!studyProgress.missedSessions) studyProgress.missedSessions = [];
 
    // ── 4. CONVERT AVAILABILITY FORMAT ────────────────────────
    
    function buildAvailabilityMap(raw) {
        const map = {};
        raw.forEach(entry => {
            const day       = entry.day;
            const startHour = parseInt(entry.start.split(":")[0], 10);
            const endHour   = parseInt(entry.end.split(":")[0], 10);
            const slots     = [];
 
            for (let h = startHour; h < endHour; h++) {
                slots.push(h.toString().padStart(2, "0") + ":00");
            }
 
            if (slots.length > 0) map[day] = slots;
        });
        return map;
    }
 
    const userAvailability = buildAvailabilityMap(rawAvailability);
 
    // ── 5. DEADLINE PRIORITY (FR3.3) ──────────────────────────
    /**
     * Returns the course name with the nearest upcoming deadline.
     * Used to pre-select the course dropdown in each cell.
     */
    function getHighestPriorityCourse() {
        const today    = new Date();
        const upcoming = userDeadlines
            .filter(d => !d.completed && new Date(d.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        return upcoming.length ? upcoming[0].course : null;
    }
 
    // ── 6. DYNAMIC WEEK RANGE ─────────────────────────────────
    function setCurrentWeekRange() {
        const now      = new Date();
        const sunday   = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        const fmt = d => d.toLocaleDateString('en-GB');
        const el  = document.getElementById('currentWeekRange');
        if (el) el.textContent = `${fmt(sunday)} - ${fmt(saturday)}`;
    }
 
    // ── 7. TABLE RENDERING ────────────────────────────────────
    const daysOfWeek = [
        "Sunday","Monday","Tuesday","Wednesday",
        "Thursday","Friday","Saturday"
    ];
 
    function renderStudyPlan() {
        tableHeaderRow.innerHTML = '<th>⏰ Time Slot</th>';
        tableBody.innerHTML      = '';
 
        const activeDays = daysOfWeek.filter(
            day => userAvailability[day] && userAvailability[day].length > 0
        );
 
        if (activeDays.length === 0) {
            const wrapper = document.querySelector('.table-responsive');
            if (wrapper)    wrapper.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
 
        // Headers
        activeDays.forEach(day => {
            const th       = document.createElement('th');
            th.textContent = day;
            tableHeaderRow.appendChild(th);
        });
 
        // Collect & sort all unique slots
        const allSlots = new Set();
        activeDays.forEach(day =>
            userAvailability[day].forEach(slot => allSlots.add(slot))
        );
        const sortedSlots = Array.from(allSlots).sort();
 
        const priorityCourse = getHighestPriorityCourse();
 
        // Build rows
        sortedSlots.forEach(slot => {
            const tr     = document.createElement('tr');
            tr.innerHTML = `<td class="time-column"><strong>${slot}</strong></td>`;
 
            activeDays.forEach(day => {
                const td          = document.createElement('td');
                const isAvailable = userAvailability[day]?.includes(slot);
 
                if (isAvailable) {
                    const sessionId = `${day}-${slot}`;
                    const isDone    = studyProgress.completedSessions.includes(sessionId);
                    const isMissed  = studyProgress.missedSessions.includes(sessionId);
 
                    // Course options — pre-select highest priority deadline course (FR3.3)
                    const courseOptions = userCourses.map(c => {
                        const sel = (!isDone && !isMissed && priorityCourse === c.name)
                            ? 'selected' : '';
                        return `<option value="${c.name}" ${sel}>${c.name}</option>`;
                    }).join('');
 
                    let cellClass = 'session-cell';
                    if (isDone)   cellClass += ' session-done';
                    if (isMissed) cellClass += ' session-missed';
 
                    // FR6.1: both Done checkbox and Missed button
                    td.innerHTML = `
                        <div class="${cellClass}" id="cell-${sessionId}">
                            <select class="course-selector" data-session="${sessionId}">
                                <option value="">Select Course</option>
                                ${courseOptions}
                            </select>
                            <div class="session-actions">
                                <label class="checkbox-container">
                                    <input type="checkbox"
                                           class="task-checkbox"
                                           data-session="${sessionId}"
                                           ${isDone   ? 'checked'  : ''}
                                           ${isMissed ? 'disabled' : ''}>
                                    <span class="checkmark"></span> Done
                                </label>
                                <button class="miss-btn ${isMissed ? 'active-miss' : ''}"
                                        data-session="${sessionId}"
                                        ${isDone || isMissed ? 'disabled' : ''}>
                                    ${isMissed ? '⚠️ Missed' : 'Mark Missed'}
                                </button>
                            </div>
                            ${isMissed
                                ? '<p class="reschedule-note">🔄 Rescheduled to next slot</p>'
                                : ''}
                        </div>
                    `;
                } else {
                    td.innerHTML = `<div class="off-slot">—</div>`;
                }
                tr.appendChild(td);
            });
 
            tableBody.appendChild(tr);
        });
 
        updateSummary();
    }
 
    // ── 8. FR7 — AUTO RESCHEDULING ────────────────────────────
    function rescheduleSession(missedId) {
        let foundMissed = false;
        for (const cell of tableBody.querySelectorAll('.session-cell')) {
            const cb  = cell.querySelector('.task-checkbox');
            if (!cb)  continue;
            const sId = cb.getAttribute('data-session');
 
            if (sId === missedId) { foundMissed = true; continue; }
 
            if (foundMissed) {
                const done   = studyProgress.completedSessions.includes(sId);
                const missed = studyProgress.missedSessions.includes(sId);
                if (!done && !missed) {
                    cell.classList.add('session-rescheduled');
                    if (!cell.querySelector('.reschedule-note')) {
                        const note       = document.createElement('p');
                        note.className   = 'reschedule-note';
                        note.textContent = '📌 Moved here (rescheduled)';
                        cell.appendChild(note);
                    }
                    break;
                }
            }
        }
    }
 
    // ── 9. PROGRESS UPDATES ───────────────────────────────────
    function updateProgress(sessionId, isChecked) {
        if (isChecked) {
            if (!studyProgress.completedSessions.includes(sessionId))
                studyProgress.completedSessions.push(sessionId);
            studyProgress.missedSessions =
                studyProgress.missedSessions.filter(id => id !== sessionId);
        } else {
            studyProgress.completedSessions =
                studyProgress.completedSessions.filter(id => id !== sessionId);
        }
        saveProgress();
        updateSummary();
        showToast(isChecked ? "Session completed! 🎉" : "Session moved back to pending.");
    }
 
    function markMissed(sessionId) {
        studyProgress.completedSessions =
            studyProgress.completedSessions.filter(id => id !== sessionId);
        if (!studyProgress.missedSessions.includes(sessionId))
            studyProgress.missedSessions.push(sessionId);
        saveProgress();
 
        const cell = document.getElementById(`cell-${sessionId}`);
        if (cell) {
            cell.classList.remove('session-done');
            cell.classList.add('session-missed');
            const cb = cell.querySelector('.task-checkbox');
            if (cb) cb.disabled = true;
            const btn = cell.querySelector('.miss-btn');
            if (btn) {
                btn.textContent = '⚠️ Missed';
                btn.classList.add('active-miss');
                btn.disabled = true;
            }
            if (!cell.querySelector('.reschedule-note')) {
                const note       = document.createElement('p');
                note.className   = 'reschedule-note';
                note.textContent = '🔄 Rescheduled to next slot';
                cell.appendChild(note);
            }
        }
 
        rescheduleSession(sessionId);
        updateSummary();
        showToast("Session marked as missed. Plan adjusted. 📋");
    }
 
    function saveProgress() {
        localStorage.setItem(
            `progress_${currentUser.id}`,
            JSON.stringify(studyProgress)
        );
    }
 
    // ── 10. SUMMARY ───────────────────────────────────────────
    function updateSummary() {
        const total   = document.querySelectorAll('.task-checkbox').length;
        const done    = studyProgress.completedSessions.length;
        const missed  = studyProgress.missedSessions.length;
        const pending = Math.max(0, total - done - missed);
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
 
        if (!summaryContainer) return;
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <span>Total Sessions:</span><strong>${total}</strong>
            </div>
            <div class="summary-item">
                <span>✅ Completed:</span>
                <strong style="color:#22c55e">${done}</strong>
            </div>
            <div class="summary-item">
                <span>⏳ Pending:</span>
                <strong style="color:#3b82f6">${pending}</strong>
            </div>
            <div class="summary-item">
                <span>⚠️ Missed:</span>
                <strong style="color:#ef4444">${missed}</strong>
            </div>
            <div class="summary-item">
                <span>📈 Weekly Goal:</span>
                <strong>${percent}% achieved</strong>
            </div>
        `;
    }
 
    // ── 11. EVENT LISTENERS ───────────────────────────────────
    tableBody.addEventListener('change', e => {
        if (!e.target.classList.contains('task-checkbox')) return;
        const sessionId = e.target.getAttribute('data-session');
        const cell      = e.target.closest('.session-cell');
        if (e.target.checked) {
            cell.classList.add('session-done');
            cell.classList.remove('session-missed');
        } else {
            cell.classList.remove('session-done');
        }
        updateProgress(sessionId, e.target.checked);
    });
 
    tableBody.addEventListener('click', e => {
        if (e.target.classList.contains('miss-btn') && !e.target.disabled)
            markMissed(e.target.getAttribute('data-session'));
    });
 
    // ── 12. TOAST ─────────────────────────────────────────────
    function showToast(message) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
 
    // ── 13. WEEKLY MOTIVATION ─────────────────────────────────
    function getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const year = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - year) / 86400000) + 1) / 7);
    }
 
    function renderWeeklyMotivation() {
        const list   = document.querySelector('.motivation-list');
        const footer = document.querySelector('.motivation-footer');
        if (!list) return;
 
        const tipSets = [
            {
                tips: ["📌 Consistency beats intensity — show up every day.",
                       "🎯 Break big topics into 25-minute focused sessions.",
                       "🌙 Rest is productive — sleep consolidates memory.",
                       "🏆 Every session completed is a deposit in your future."],
                footer: "Week focus: Build the habit. 💪"
            },
            {
                tips: ["🔥 Momentum is building — don't stop now.",
                       "📝 Review notes within 24 hours to boost retention by 60%.",
                       "🎵 Try instrumental music to stay in flow state longer.",
                       "⏱ Pomodoro: 25 min study, 5 min break — try it!"],
                footer: "Week focus: Strengthen your routine. 🚀"
            },
            {
                tips: ["🧠 Teach what you learn — explaining cements understanding.",
                       "📅 Check your deadlines — don't wait for the last day.",
                       "💧 Stay hydrated — your brain is 75% water.",
                       "✍️ Handwriting notes helps memory more than typing."],
                footer: "Week focus: Deepen your understanding. 🧩"
            },
            {
                tips: ["🌟 That's a habit forming — keep it.",
                       "🔄 Spaced repetition: revisit last week's material today.",
                       "🧘 5-minute mindfulness before studying boosts focus.",
                       "📊 Check your Progress page — celebrate small wins!"],
                footer: "Week focus: Review and reinforce. 🎯"
            },
            {
                tips: ["⚡ Push through the mid-semester slump — it's temporary.",
                       "🤝 Study with a partner once this week for accountability.",
                       "📖 Summarise each lecture in 5 bullet points max.",
                       "🏃 Short walks between sessions refresh your focus."],
                footer: "Week focus: Stay sharp. 💫"
            },
            {
                tips: ["🎯 Set one clear goal for this week and track it daily.",
                       "💡 Confused? Find 3 different explanations of the topic.",
                       "🌅 Morning study sessions improve memory retention.",
                       "📌 Update your study plan if things feel off-track."],
                footer: "Week focus: Recalibrate and push forward. ⚙️"
            },
            {
                tips: ["🏁 The finish line is closer than you think.",
                       "📝 Prioritise: high-stakes topics first.",
                       "😴 8 hours of sleep the night before an exam matters most.",
                       "🎉 Reward yourself after completing a tough session."],
                footer: "Week focus: Final stretch — give it everything. 🌠"
            }
        ];
 
        const idx     = (getWeekNumber(new Date()) - 1) % tipSets.length;
        const current = tipSets[idx];
        list.innerHTML  = current.tips.map(t => `<li>${t}</li>`).join('');
        if (footer) footer.textContent = current.footer;
    }
 
    // ── 14. INITIAL EXECUTION ─────────────────────────────────
    setCurrentWeekRange();
    renderStudyPlan();
    renderWeeklyMotivation();
 
});