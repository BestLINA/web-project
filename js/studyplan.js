document.addEventListener('DOMContentLoaded', () => {

    // ── 1. SESSION CHECK ──────────────────────────────────────
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "../html/login.html";
        return;
    }

    // ── 2. DOM ELEMENTS ───────────────────────────────────────
    const tableBody = document.getElementById('tableBody');
    const tableHeaderRow = document.getElementById('tableHeaderRow');
    const emptyState = document.getElementById('tableEmptyState');
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

    // Upgraded data structure to support keeping track of both status and selected course
    let studyProgress = JSON.parse(
        localStorage.getItem(`progress_${currentUser.id}`)
    ) || { completedSessions: [], missedSessions: [] };

    if (!studyProgress.missedSessions) studyProgress.missedSessions = [];

    // ── 4. CONVERT AVAILABILITY FORMAT ────────────────────────
    function buildAvailabilityMap(raw) {
        const map = {};
        raw.forEach(entry => {
            const day = entry.day;
            const startHour = parseInt(entry.start.split(":")[0], 10);
            const endHour = parseInt(entry.end.split(":")[0], 10);
            const slots = [];

            for (let h = startHour; h < endHour; h++) {
                slots.push(h.toString().padStart(2, "0") + ":00");
            }

            if (slots.length > 0) map[day] = slots;
        });
        return map;
    }

    const userAvailability = buildAvailabilityMap(rawAvailability);

    // ── 5. DEADLINE PRIORITY (FR3.3) ──────────────────────────
    function getHighestPriorityCourse() {
        const today = new Date();
        const upcoming = userDeadlines
            .filter(d => !d.completed && new Date(d.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        return upcoming.length ? upcoming[0].course : null;
    }

    // ── 6. DYNAMIC WEEK RANGE ─────────────────────────────────
    function setCurrentWeekRange() {
        const now = new Date();
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        const fmt = d => d.toLocaleDateString('en-GB');
        const el = document.getElementById('currentWeekRange');
        if (el) el.textContent = `${fmt(sunday)} - ${fmt(saturday)}`;
    }

    // ── 7. TABLE RENDERING ────────────────────────────────────
    const daysOfWeek = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    function renderStudyPlan() {
        tableHeaderRow.innerHTML = '<th><img src="../imgs/clock.png" class="mini-icon" alt="Clock icon"> Time Slot</th>';
        tableBody.innerHTML = '';

        const activeDays = daysOfWeek.filter(
            day => userAvailability[day] && userAvailability[day].length > 0
        );

        if (activeDays.length === 0) {
            const wrapper = document.querySelector('.table-responsive');
            if (wrapper) wrapper.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Headers
        activeDays.forEach(day => {
            const th = document.createElement('th');
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
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="time-column"><strong>${slot}</strong></td>`;

            activeDays.forEach(day => {
                const td = document.createElement('td');
                const isAvailable = userAvailability[day]?.includes(slot);

                if (isAvailable) {
                    const sessionId = `${day}-${slot}`;
                    
                    // Search if session is saved as an object or flat string for backwards compatibility
                    const savedDone = studyProgress.completedSessions.find(s => s === sessionId || s.id === sessionId);
                    const savedMissed = studyProgress.missedSessions.find(s => s === sessionId || s.id === sessionId);
                    
                    const isDone = !!savedDone;
                    const isMissed = !!savedMissed;

                    // Extract the saved course name if available
                    let savedCourseName = (savedDone && savedDone.course) || (savedMissed && savedMissed.course) || "";
                    
                    // If not interacted yet, check if there's a custom dynamic pending selection saved
                    if (!isDone && !isMissed && studyProgress.pendingCourses) {
                        savedCourseName = studyProgress.pendingCourses[sessionId] || "";
                    }

                    const courseOptions = userCourses.map(c => {
                        let sel = '';
                        if (savedCourseName) {
                            // If a course was explicitly saved by the user, preserve it
                            sel = (savedCourseName === c.name) ? 'selected' : '';
                        } else {
                            // Default priority fallback for non-interacted slots
                            sel = (!isDone && !isMissed && priorityCourse === c.name) ? 'selected' : '';
                        }
                        return `<option value="${c.name}" ${sel}>${c.name}</option>`;
                    }).join('');

                    let cellClass = 'session-cell';
                    if (isDone) cellClass += ' session-done';
                    if (isMissed) cellClass += ' session-missed';

                    td.innerHTML = `
                        <div class="${cellClass}" id="cell-${sessionId}">
                            <select class="course-selector" data-session="${sessionId}" ${isDone || isMissed ? 'disabled' : ''}>
                                <option value="">Select Course</option>
                                ${courseOptions}
                            </select>
                            <div class="session-actions">
                                <label class="checkbox-container">
                                    <input type="checkbox"
                                           class="task-checkbox"
                                           data-session="${sessionId}"
                                           ${isDone ? 'checked' : ''}
                                           ${isMissed ? 'disabled' : ''}>
                                    <span class="checkmark"></span> Done
                                </label>
                                <button class="miss-btn ${isMissed ? 'active-miss' : ''}"
                                        data-session="${sessionId}"
                                        ${isDone || isMissed ? 'disabled' : ''}>
                                    ${isMissed ? '<img src="../imgs/warningRed.png" class="mini-icon" alt="Red warning status icon"> Missed' : 'Mark Missed'}
                                </button>
                            </div>
                            ${isMissed
                            ? '<p class="reschedule-note"><img src="../imgs/clock.png" class="mini-icon" alt="Clock re-schedule icon"> Rescheduled to next slot</p>'
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

    // ── 8.AUTO RESCHEDULING ────────────────────────────
    function rescheduleSession(missedId) {
        let foundMissed = false;
        for (const cell of tableBody.querySelectorAll('.session-cell')) {
            const cb = cell.querySelector('.task-checkbox');
            if (!cb) continue;
            const sId = cb.getAttribute('data-session');

            if (sId === missedId) { foundMissed = true; continue; }

            if (foundMissed) {
                const done = studyProgress.completedSessions.some(s => s === sId || s.id === sId);
                const missed = studyProgress.missedSessions.some(s => s === sId || s.id === sId);
                if (!done && !missed) {
                    cell.classList.add('session-rescheduled');
                    if (!cell.querySelector('.reschedule-note')) {
                        const note = document.createElement('p');
                        note.className = 'reschedule-note';
                        note.innerHTML = '<img src="../imgs/pin.png" class="mini-icon" alt="Pin marker icon"> Moved here (rescheduled)';
                        cell.appendChild(note);
                    }
                    break;
                }
            }
        }
    }

    // ── 9. PROGRESS UPDATES WITH COURSE RETENTION ─────────────
    function updateProgress(sessionId, isChecked) {
        // Find the adjacent select element to read the currently selected course name
        const selectEl = document.querySelector(`select[data-session="${sessionId}"]`);
        const currentCourse = selectEl ? selectEl.value : "";

        // Clean out any existing entries for this session ID
        studyProgress.completedSessions = studyProgress.completedSessions.filter(s => s !== sessionId && s.id !== sessionId);
        studyProgress.missedSessions = studyProgress.missedSessions.filter(s => s !== sessionId && s.id !== sessionId);

        if (isChecked) {
            // Push structured object containing both session details and the assigned course name
            studyProgress.completedSessions.push({ id: sessionId, course: currentCourse });
            if (selectEl) selectEl.disabled = true; // Lock the select input once done
            
            // Clean from pending if saved there
            if (studyProgress.pendingCourses) delete studyProgress.pendingCourses[sessionId];
        } else {
            if (selectEl) selectEl.disabled = false; // Re-enable if unmarked
        }
        
        saveProgress();
        updateSummary();
        showToast(
            isChecked ? "Session completed!" : "Session moved back to pending.",
            isChecked ? "celebrate" : "pending"
        );
    }

    function markMissed(sessionId) {
        // Find the adjacent select element to read the currently selected course name
        const selectEl = document.querySelector(`select[data-session="${sessionId}"]`);
        const currentCourse = selectEl ? selectEl.value : "";

        studyProgress.completedSessions = studyProgress.completedSessions.filter(s => s !== sessionId && s.id !== sessionId);
        studyProgress.missedSessions = studyProgress.missedSessions.filter(s => s !== sessionId && s.id !== sessionId);
        
        // Save as structured object to preserve course selection
        studyProgress.missedSessions.push({ id: sessionId, course: currentCourse });
        
        // Clean from pending if saved there
        if (studyProgress.pendingCourses) delete studyProgress.pendingCourses[sessionId];
        
        saveProgress();

        const cell = document.getElementById(`cell-${sessionId}`);
        if (cell) {
            cell.classList.remove('session-done');
            cell.classList.add('session-missed');
            const cb = cell.querySelector('.task-checkbox');
            if (cb) cb.disabled = true;
            if (selectEl) selectEl.disabled = true; // Lock the select input once missed
            const btn = cell.querySelector('.miss-btn');
            if (btn) {
                btn.innerHTML = '<img src="../imgs/warningRed.png" class="mini-icon" alt="Red warning status icon"> Missed';
                btn.classList.add('active-miss');
                btn.disabled = true;
            }
            if (!cell.querySelector('.reschedule-note')) {
                const note = document.createElement('p');
                note.className = 'reschedule-note';
                note.innerHTML = '<img src="../imgs/clock.png" class="mini-icon" alt="Clock re-schedule icon"> Rescheduled to next slot';
                cell.appendChild(note);
            }
        }

        rescheduleSession(sessionId);
        updateSummary();
        showToast("Session marked as missed. Plan adjusted.", "error");
    }

    function saveProgress() {
        localStorage.setItem(
            `progress_${currentUser.id}`,
            JSON.stringify(studyProgress)
        );
    }

    // ── 10. SUMMARY ───────────────────────────────────────────
    function updateSummary() {
        const total = document.querySelectorAll('.task-checkbox').length;
        const done = studyProgress.completedSessions.length;
        const missed = studyProgress.missedSessions.length;
        const pending = Math.max(0, total - done - missed);
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        if (!summaryContainer) return;
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <span>Total Sessions:</span><strong>${total}</strong>
            </div>
            <div class="summary-item">
                <span><img src="../imgs/checkMark.png" class="mini-icon" alt="Green checkmark icon"> Completed:</span>
               <strong class="count-done">${done}</strong>
            </div>
            <div class="summary-item">
                <span><img src="../imgs/hourglass.png" class="mini-icon" alt="Hourglass status icon"> Pending:</span>
                <strong class="count-pending">${pending}</strong>
            </div>
            <div class="summary-item">
                <span><img src="../imgs/warningRed.png" class="mini-icon" alt="Red warning metric icon"> Missed:</span>
                <strong class="count-missed">${missed}</strong>
            </div>
            <div class="summary-item">
                <span><img src="../imgs/graph.png" class="mini-icon" alt="Progress graph icon"> Weekly Goal:</span>
                <strong>${percent}% achieved</strong>
            </div>
        `;
    }

    // ── 11. EVENT LISTENERS (WITH VALIDATION) ─────────────────
    tableBody.addEventListener('change', e => {
        if (!e.target.classList.contains('task-checkbox')) return;
        
        const sessionId = e.target.getAttribute('data-session');
        const cell = e.target.closest('.session-cell');
        
        // Find the adjacent course selector dropdown
        const selectEl = document.querySelector(`select[data-session="${sessionId}"]`);
        
        // Validation check: If no course is selected, block action and alert user
        if (e.target.checked && (!selectEl || !selectEl.value)) {
            e.target.checked = false; // uncheck the checkbox instantly
            showToast("Please select a course before marking this session as done.", "error");
            return;
        }

        if (e.target.checked) {
            cell.classList.add('session-done');
            cell.classList.remove('session-missed');
        } else {
            cell.classList.remove('session-done');
        }
        updateProgress(sessionId, e.target.checked);
    });

    tableBody.addEventListener('click', e => {
        if (e.target.classList.contains('miss-btn') && !e.target.disabled) {
            const sessionId = e.target.getAttribute('data-session');
            
            // Find the adjacent course selector dropdown
            const selectEl = document.querySelector(`select[data-session="${sessionId}"]`);
            
            // Validation check: If no course is selected, block action and alert user
            if (!selectEl || !selectEl.value) {
                showToast("Please select a course before marking this session as missed.", "error");
                return;
            }

            markMissed(sessionId);
        }
    });

    tableBody.addEventListener('change', e => {
        if (!e.target.classList.contains('course-selector')) return;
        const sessionId = e.target.getAttribute('data-session');
        
        if (!studyProgress.pendingCourses) {
            studyProgress.pendingCourses = {};
        }
        studyProgress.pendingCourses[sessionId] = e.target.value;
        saveProgress();
    });

    // ── 12. TOAST ─────────────────────────────────────────────
    function showToast(text, type) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;

        let iconClass = "toast-icon";
        let icon = "../imgs/checkMark.png";
        let altText = "Success checkmark alert icon";

        toast.classList.remove('toast-error', 'toast-success');

        if (type === "celebrate") {
            icon = "../imgs/celebrate.png";
            iconClass = "toast-icon-lg";
            altText = "Celebration party popper alert icon";
        }
        if (type === "error") {
            icon = "../imgs/warningRed.png";
            altText = "Red warning notification icon";
            toast.classList.add('toast-error');
        }

        toast.innerHTML = `<img src="${icon}" class="${iconClass}" alt="${altText}"> ${text}`;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.remove('toast-error');
        }, 3000);
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
        const motivationContainer = document.getElementById("motivationText");
        const footer = document.querySelector('.motivation-footer');
        if (!motivationContainer) return;

        const quotes = [
            "Success is the sum of small efforts, repeated day in and day out.",
            "The best way to predict the future is to invent it. Keep coding!",
            "Focus on progress, not perfection. You've got this!",
            "Big journeys begin with small, consistent steps. Stay on track!",
            "Before software can be reusable it first has to be usable. Step by step!",
            "Mistakes are proof that you are trying and learning. Keep it up!",
            "Do something today that your future self will thank you for."
        ];

        const idx = getWeekNumber(new Date()) % quotes.length;
        const currentQuote = quotes[idx];

        motivationContainer.innerHTML = `
            <div class="availability-tip">
                <img src="../imgs/purpleLightbulb.png" class="mini-icon" alt="Purple lightbulb idea icon"> 
                <strong>This Week's Motivation:</strong> ${currentQuote}
            </div>
        `;

        if (footer) {
            const focuses = [
                "Build the habit", "Strengthen your routine", "Deepen understanding", 
                "Review and reinforce", "Stay sharp", "Recalibrate", "Final stretch"
            ];
            const focusIdx = getWeekNumber(new Date()) % focuses.length;
            footer.innerHTML = `<p>Week focus: ${focuses[focusIdx]} <img src="../imgs/success.png" class="mini-icon" alt="Green celebration check icon"></p>`;
        }
    }

    // ── 14. INITIAL EXECUTION ─────────────────────────────────
    setCurrentWeekRange();
    renderStudyPlan();
    renderWeeklyMotivation();

});