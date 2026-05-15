// ================= LOGIN CHECK =================
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
    window.location.href = "../html/login.html";
}

const storageKey = "deadlines_" + currentUser.id;

let deadlines = JSON.parse(localStorage.getItem(storageKey)) || [];

// ================= ELEMENTS =================
const taskName = document.getElementById("taskName");
const taskType = document.getElementById("taskType");
const taskDate = document.getElementById("taskDate");
const addBtn = document.getElementById("addDeadlineBtn");

const container = document.getElementById("deadlinesContainer");
const emptyBox = document.getElementById("emptyDeadlines");

// MODAL
const modal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const editTitle = document.getElementById("editTitle");
const editType = document.getElementById("editType");
const editDate = document.getElementById("editDate");
const saveEditBtn = document.getElementById("saveEditBtn");

let currentEditIndex = null;

// ================= HELPERS =================
function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(deadlines));
}

// DAYS LEFT CALCULATION ⭐
function getDaysLeft(date) {
    const today = new Date();
    const target = new Date(date);

    const diff = target - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days;
}

// TOAST
function showToast(text, type) {
    const toast = document.getElementById("toast");

    toast.textContent = text;
    toast.className = "toast toast-visible";
    toast.classList.add(type === "success" ? "toast-success" : "toast-error");

    setTimeout(() => {
        toast.classList.remove("toast-visible");
    }, 3000);
}

// ================= RENDER =================
function render() {
    container.innerHTML = "";

    if (deadlines.length === 0) {
        emptyBox.style.display = "block";
        return;
    }

    emptyBox.style.display = "none";

    deadlines.forEach((item, index) => {

        const daysLeft = getDaysLeft(item.date);

        const div = document.createElement("div");
        div.className = "card deadline-item";

        // AUTO COMPLETE IF PAST
        if (daysLeft < 0) {
            item.completed = true;
        }

        if (item.completed) {
            div.classList.add("deadline-done");
        }

        div.innerHTML = `
            <div class="deadline-info">
                <strong>${item.title}</strong>
                <small>${item.type} | ${item.date}</small>
                <span class="days-left">
                    ${item.completed ? "Completed" : daysLeft + " days left"}
                </span>
            </div>

            <div class="deadline-actions">
                <button class="btn update-btn">Update</button>
                <button class="btn delete-btn">Delete</button>
            </div>
        `;

        // ================= DOUBLE CLICK (COMPLETE) =================
        div.addEventListener("dblclick", () => {
            item.completed = !item.completed;
            saveData();
            render();
        });

        // ================= DELETE =================
        div.querySelector(".delete-btn").addEventListener("click", () => {
            deadlines.splice(index, 1);
            saveData();
            render();
            showToast("Deleted successfully", "success");
        });

        // ================= OPEN MODAL EDIT =================
        div.querySelector(".update-btn").addEventListener("click", () => {

            currentEditIndex = index;

            editTitle.value = item.title;
            editType.value = item.type;
            editDate.value = item.date;

            modal.style.display = "flex";
        });

        container.appendChild(div);
    });
}

// ================= ADD DEADLINE =================
addBtn.addEventListener("click", () => {

    const title = taskName.value.trim();
    const type = taskType.value;
    const date = taskDate.value;

    const today = new Date().toISOString().split("T")[0];

    if (!title || !type || !date) {
        showToast("Please fill all fields", "error");
        return;
    }

    if (date < today) {
        showToast("⚠️ Please choose a future date", "error");
        return;
    }

    deadlines.push({
        title,
        type,
        date,
        completed: false
    });

    saveData();
    render();

    taskName.value = "";
    taskType.value = "";
    taskDate.value = "";

    showToast("Added successfully", "success");
});

// ================= SAVE EDIT =================
saveEditBtn.addEventListener("click", () => {

    const today = new Date().toISOString().split("T")[0];

    if (editDate.value < today) {
        showToast("❌ Cannot set past date", "error");
        return;
    }

    deadlines[currentEditIndex].title = editTitle.value;
    deadlines[currentEditIndex].type = editType.value;
    deadlines[currentEditIndex].date = editDate.value;

    saveData();
    render();

    modal.style.display = "none";
    showToast("Updated successfully", "success");
});

// CLOSE MODAL
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// CLOSE OUTSIDE CLICK
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// INIT
render();