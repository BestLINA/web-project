/**
 * AWJ Study Planner - Study Plan Logic
 * Version: 2.0 (Premium UI Integrated)
 * Description: Handles dynamic table generation, session selection, 
 * checkbox persistence, and real-time progress calculations.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DATA INITIALIZATION & SESSION CHECK ---
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Redirect to login if no user session is found
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // DOM Elements Selection
    const tableBody = document.getElementById('tableBody');
    const tableHeaderRow = document.getElementById('tableHeaderRow');
    const emptyState = document.getElementById('tableEmptyState');
    const summaryContainer = document.getElementById('dynamicSummaryContent');

    // Fetch user-specific data from LocalStorage
    const userAvailability = JSON.parse(localStorage.getItem(`availability_${currentUser.email}`)) || {};
    const userCourses = JSON.parse(localStorage.getItem(`courses_${currentUser.email}`)) || [];
    
    // Initialize or load existing progress data
    let studyProgress = JSON.parse(localStorage.getItem(`progress_${currentUser.email}`)) || { 
        completedSessions: [], 
        totalSessions: 0 
    };

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // --- 2. DYNAMIC TABLE GENERATION ENGINE ---
    /**
     * Renders the study plan table based on the user's availability settings.
     * Includes course selectors and completion checkboxes.
     */
    function renderStudyPlan() {
        // Reset table content
        tableHeaderRow.innerHTML = '<th>⏰ Time Slot</th>';
        tableBody.innerHTML = '';

        // Filter days that have at least one time slot selected
        const activeDays = daysOfWeek.filter(day => userAvailability[day] && userAvailability[day].length > 0);

        // Show empty state if no availability is configured
        if (activeDays.length === 0) {
            const tableWrapper = document.querySelector('.table-responsive');
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Create Table Headers for active days
        activeDays.forEach(day => {
            const th = document.createElement('th');
            th.innerHTML = `${day}`;
            tableHeaderRow.appendChild(th);
        });

        // Collect and sort unique time slots across all active days
        const allTimeSlots = new Set();
        activeDays.forEach(day => {
            userAvailability[day].forEach(slot => allTimeSlots.add(slot));
        });

        const sortedSlots = Array.from(allTimeSlots).sort();

        // Build Table Rows for each time slot
        sortedSlots.forEach(slot => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="time-column"><strong>${slot}</strong></td>`;

            activeDays.forEach(day => {
                const td = document.createElement('td');
                const isAvailable = userAvailability[day].includes(slot);

                if (isAvailable) {
                    const sessionId = `${day}-${slot}`;
                    const isDone = studyProgress.completedSessions.includes(sessionId);
                    
                    // Injecting Interactive UI Elements: Course Selector & Done Checkbox
                    td.innerHTML = `
                        <div class="session-cell ${isDone ? 'session-done' : ''}">
                            <select class="course-selector" data-session="${sessionId}">
                                <option value="">Select Course</option>
                                ${userCourses.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                            </select>
                            <label class="checkbox-container">
                                <input type="checkbox" class="task-checkbox" data-session="${sessionId}" ${isDone ? 'checked' : ''}>
                                <span class="checkmark"></span> Done
                            </label>
                        </div>
                    `;
                } else {
                    td.innerHTML = `<div class="off-slot">-</div>`;
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        updateSummary();
    }

    // --- 3. PROGRESS MANAGEMENT & SYNCING ---
    /**
     * Updates the global progress state when a checkbox is toggled.
     * @param {string} sessionId - Unique ID for the time slot (Day-Time).
     * @param {boolean} isChecked - The status of the checkbox.
     */
    function updateProgress(sessionId, isChecked) {
        if (isChecked) {
            if (!studyProgress.completedSessions.includes(sessionId)) {
                studyProgress.completedSessions.push(sessionId);
            }
        } else {
            studyProgress.completedSessions = studyProgress.completedSessions.filter(id => id !== sessionId);
        }

        // Persist data to LocalStorage
        localStorage.setItem(`progress_${currentUser.email}`, JSON.stringify(studyProgress));
        updateSummary();
        
        // Visual feedback to user
        showToast(isChecked ? "Session completed! Well done! 🎉" : "Session moved back to pending.");
    }

    /**
     * Calculates and displays the weekly summary statistics.
     */
    function updateSummary() {
        const total = document.querySelectorAll('.task-checkbox').length;
        const done = studyProgress.completedSessions.length;
        const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
        
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="summary-item">
                    <span>Total Sessions Scheduled:</span> <strong>${total}</strong>
                </div>
                <div class="summary-item">
                    <span>Completed Sessions:</span> <strong style="color: #5c2d7a;">${done}</strong>
                </div>
                <div class="summary-item">
                    <span>Weekly Goal Completion:</span> <strong>${percentage}% achieved</strong>
                </div>
            `;
        }
    }

    // --- 4. EVENT LISTENERS ---
    // Handle checkbox changes for session completion
    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const sessionId = e.target.getAttribute('data-session');
            const cell = e.target.closest('.session-cell');
            
            // Toggle visual 'done' state
            if (e.target.checked) {
                cell.classList.add('session-done');
            } else {
                cell.classList.remove('session-done');
            }
            
            updateProgress(sessionId, e.target.checked);
        }
    });

    /**
     * Triggers a temporary toast notification for user feedback.
     * @param {string} message - The text to display.
     */
    function showToast(message) {
        const toast = document.getElementById('toastNotification');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    // --- 5. INITIAL EXECUTION ---
    renderStudyPlan();
});