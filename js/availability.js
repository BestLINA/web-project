
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
//   HELPER — fill a select with hours
//            from 00:00 to 23:00
// =========================================

function fillHours(selectId) {
    const select = document.getElementById(selectId);

    for (let i = 0; i < 24; i++) {
        // padStart makes sure 1 becomes 01, 9 becomes 09, etc.
        const hour = i.toString().padStart(2, "0") + ":00";

        const option = document.createElement("option");
        option.value = hour;
        option.textContent = hour;
        select.appendChild(option);
    }
}

// fill all 14 selects (start + end for each of the 7 days)
days.forEach(day => {
    fillHours("start-" + day);
    fillHours("end-" + day);
});

// =========================================
//   PART 1 — set up checkboxes and
//            dropdowns when page loads
// =========================================

days.forEach(day => {
    const checkbox = document.getElementById("check-" + day);
    const start = document.getElementById("start-" + day);
    const end = document.getElementById("end-" + day);

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

// =========================================
//   PART 2 — load saved availability
//            from localStorage on page open
// =========================================

const saved = JSON.parse(localStorage.getItem(storageKey));

if (saved) {
    saved.forEach(entry => {
        const day = entry.day.toLowerCase();
        const checkbox = document.getElementById("check-" + day);
        const start = document.getElementById("start-" + day);
        const end = document.getElementById("end-" + day);

        // restore the saved state for this day
        if (checkbox && start && end) {
            checkbox.checked = true;
            start.disabled = false;
            end.disabled = false;
            start.style.opacity = "1";
            end.style.opacity = "1";
            start.value = entry.start;
            end.value = entry.end;
        }
    });
}

// =========================================
//   PART 3 — save button logic
// =========================================

const saveBtn = document.querySelector(".availability-save-btn");

saveBtn.addEventListener("click", () => {
    const availability = [];
    let hasError = false;

    days.forEach(day => {
        const checkbox = document.getElementById("check-" + day);
        const start = document.getElementById("start-" + day);
        const end = document.getElementById("end-" + day);

        // only process days the user checked
        if (checkbox.checked) {

            // make sure both times are selected
            if (!start.value || !end.value) {
                hasError = true;

                // don't allow end time to be before or equal to start time
            } else if (start.value >= end.value) {
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

        // at least one day must be selected
    } else if (availability.length === 0) {
        showToast(" Please check at least one day.", "error");

    } else {
        // save to localStorage under this user's unique key
        localStorage.setItem(storageKey, JSON.stringify(availability));
        showToast(" Availability saved successfully!", "success");
    }
});

// =========================================
//   HELPER — show a toast notification
//            at the top then fade it out
// =========================================

function showToast(text, type) {
    const toast = document.getElementById("toast");

    const icon = type === "success" ? "../imgs/success.png" : "../imgs/warningRed.png";
    toast.innerHTML = `<img src="${icon}" class="toast-icon" alt=""> ${text}`;

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
                    <img src="../imgs/pin.png" class="availability-pin" alt="">
                    ${tip.trim()}
                </div>
            `;
        });

    } catch (error) {
        // fallback to static tips if API fails
        container.innerHTML = `
            <div class="availability-tip">
                <img src="../imgs/pin.png" class="availability-pin" alt=""> Be consistent with your study hours
            </div>
            <div class="availability-tip">
                <img src="../imgs/pin.png" class="availability-pin" alt=""> Take 10–15 min breaks every 1–2 hours
            </div>
            <div class="availability-tip">
                <img src="../imgs/pin.png" class="availability-pin" alt=""> Avoid over-scheduling
            </div>
        `;
    }
}

// call it when page loads
loadAITips();