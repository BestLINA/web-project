// check if user is logged in, if not send them back to login
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
    window.location.href = "../html/login.html";
}

// build a unique storage key for this specific user
const storageKey = "availability_" + currentUser.id;

// the 7 days — must match the ids in the HTML
const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

// =========================================
//   HELPER — generate hours HTML options
//            from 00:00 to 23:00
// =========================================
function generateHourOptions(placeholder) {
    let options = `<option value="" disabled selected>${placeholder}</option>`;
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0") + ":00";
        options += `<option value="${hour}">${hour}</option>`;
    }
    return options;
}

// =========================================
//   MAIN — initialize page states & DOM
// =========================================
function initAvailability() {
    // load saved availability from localStorage first
    const saved = JSON.parse(localStorage.getItem(storageKey)) || [];

    days.forEach(day => {
        const checkbox = document.getElementById("check-" + day);
        const start = document.getElementById("start-" + day);
        const end = document.getElementById("end-" + day);

        if (!checkbox || !start || !end) return;

        // fill start and end selects with hours options
        start.innerHTML = generateHourOptions("Start");
        end.innerHTML = generateHourOptions("End");

        // restore the saved state for this day if it exists
        const entry = saved.find(e => e.day.toLowerCase() === day);
        if (entry) {
            checkbox.checked = true;
            start.value = entry.start;
            end.value = entry.end;
        }

        // gray out dropdowns for days that are not checked
        start.disabled = !checkbox.checked;
        end.disabled = !checkbox.checked;
        start.style.opacity = checkbox.checked ? "1" : "0.4";
        end.style.opacity = checkbox.checked ? "1" : "0.4";

        // when the user clicks a checkbox, enable or disable its dropdowns
        checkbox.addEventListener("change", () => {
            const isChecked = checkbox.checked;

            start.disabled = !isChecked;
            end.disabled = !isChecked;
            start.style.opacity = isChecked ? "1" : "0.4";
            end.style.opacity = isChecked ? "1" : "0.4";

            // clear the times if the user unchecks the day
            if (!isChecked) {
                start.value = "";
                end.value = "";
            }
        });
    });

    // load AI study tips right after rendering the DOM states
    loadAITips();
}

// run the setup when the DOM is fully ready
document.addEventListener("DOMContentLoaded", initAvailability);

// =========================================
//   PART 3 — save button logic
// =========================================
const saveBtn = document.querySelector(".availability-save-btn");

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        const availability = [];
        let hasError = false;

        days.forEach(day => {
            const checkbox = document.getElementById("check-" + day);
            const start = document.getElementById("start-" + day);
            const end = document.getElementById("end-" + day);

            // only process days the user checked
            if (checkbox && checkbox.checked) {
                // make sure both times are selected and end time is after start time
                if (!start.value || !end.value || start.value >= end.value) {
                    hasError = true;
                } else {
                    // capitalize the first letter of the day name before saving
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                    availability.push({
                        day: dayName,
                        start: start.value,
                        end: end.value
                    });
                }
            }
        });

        // show error if any checked day has missing or invalid times
        if (hasError) {
            showToast(" Please select valid start and end times for all checked days.", "error");
        } else if (availability.length === 0) {
            // at least one day must be selected
            showToast(" Please check at least one day.", "error");
        } else {
            // save to localStorage under this user's unique key
            localStorage.setItem(storageKey, JSON.stringify(availability));
            showToast(" Availability saved successfully!", "success");
            
            // refresh tips to stay synchronized
            loadAITips();
        }
    });
}

// =========================================
//   HELPER — show a toast notification
// =========================================
function showToast(text, type) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    const icon = type === "success" ? "../imgs/success.png" : "../imgs/warningRed.png";
    const altText = type === "success" ? "Success icon" : "Error icon";
    toast.innerHTML = `<img src="${icon}" class="toast-icon" alt="${altText}"> ${text}`;
    // remove old classes and apply the right color
    toast.className = "";
    toast.classList.add("toast");
    toast.classList.add(type === "success" ? "toast-success" : "toast-error");
    toast.classList.add("toast-visible");

    // hide it after 3 seconds
    setTimeout(() => {
        toast.classList.remove("toast-visible");
    }, 3000);
}

// =========================================
//   GEMINI — load AI study tips
// =========================================
async function loadAITips() {
    const API_KEY = "AIzaSyBCOGvtuTuQkJPHVjiABvjJT7mWeUexk4E";
    const container = document.getElementById("tipsContainer");
    if (!container) return;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": API_KEY
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: "Give me exactly 3 short study tips for university students. Each tip should be one sentence. Return them as a numbered list like: 1. tip 2. tip 3. tip"
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // split by numbered list
        const tips = text.split(/\d+\./).filter(t => t.trim() !== "");
        container.innerHTML = "";

        tips.forEach(tip => {
        container.innerHTML += `
        <div class="availability-tip">
            <img src="../imgs/pin.png" class="availability-pin" alt="Pin icon" aria-hidden="true">
            ${tip.trim()}
        </div>
    `;
        });

    } catch (error) {
        // fallback to static tips if API fails
        container.innerHTML = `
            <div class="availability-tip">
                <img src="../imgs/pin.png" class="availability-pin" alt="Pin icon" aria-hidden="true">
                Be consistent with your study hours
            </div>
            <div class="availability-tip">
                <img src="../imgs/pin.png" class="availability-pin" alt="Pin icon" aria-hidden="true">
                Take 10–15 min breaks every 1–2 hours
            </div>
            <div class="availability-tip">
                <img src="../imgs/pin.png" class="availability-pin" alt="Pin icon" aria-hidden="true">
                Avoid over-scheduling
            </div>
        `;
    }
}