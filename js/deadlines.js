// ================= LOGIN CHECK =================
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
    window.location.href = "../html/login.html";
}

// ================= STORAGE KEYS =================
const storageKey = "deadlines_" + currentUser.id;

// courses storage key
const coursesKey = "courses_" + currentUser.id;

// ================= LOAD DATA =================
let deadlines =
    JSON.parse(localStorage.getItem(storageKey)) || [];

// load saved courses
const savedCourses =
    JSON.parse(localStorage.getItem(coursesKey)) || [];

// ================= ELEMENTS =================

// COURSE DROPDOWN
const taskCourse =
    document.getElementById("taskCourse");

// TASK TITLE
const taskName =
    document.getElementById("taskName");

// TYPE
const taskType =
    document.getElementById("taskType");

// DATE
const taskDate =
    document.getElementById("taskDate");

// ADD BUTTON
const addBtn =
    document.getElementById("addDeadlineBtn");

// CONTAINER
const container =
    document.getElementById("deadlinesContainer");

// EMPTY STATE
const emptyBox =
    document.getElementById("emptyDeadlines");

// ================= MODAL ELEMENTS =================
const modal =
    document.getElementById("editModal");

const closeModal =
    document.getElementById("closeModal");

const editTitle =
    document.getElementById("editTitle");

const editType =
    document.getElementById("editType");

const editDate =
    document.getElementById("editDate");

const saveEditBtn =
    document.getElementById("saveEditBtn");

// CURRENT EDIT INDEX
let currentEditIndex = null;

// ================= LOAD COURSES INTO DROPDOWN =================

// add saved courses to dropdown
savedCourses.forEach(course => {

    const option = document.createElement("option");

    option.value = course.name;

    option.textContent = course.name;

    taskCourse.appendChild(option);
});

// ================= HELPERS =================

// SAVE DATA
function saveData() {

    localStorage.setItem(
        storageKey,
        JSON.stringify(deadlines)
    );
}

// ================= DAYS LEFT =================
function getDaysLeft(date) {

    const today = new Date();

    const target = new Date(date);

    const diff = target - today;

    const days = Math.ceil(
        diff / (1000 * 60 * 60 * 24)
    );

    return days;
}

// ================= TOAST =================
function showToast(text, type) {

    const toast =
        document.getElementById("toast");

    const icon = type === "success" ? "../imgs/success.png" : "../imgs/warningRed.png";
    toast.innerHTML = `<img src="${icon}" class="toast-icon" alt=""> ${text}`;

    toast.className =
        "toast toast-visible";

    toast.classList.add(
        type === "success"
            ? "toast-success"
            : "toast-error"
    );

    setTimeout(() => {

        toast.classList.remove(
            "toast-visible"
        );

    }, 3000);
}

// ================= RENDER =================
function render() {

    // clear old items
    container.innerHTML = "";

    // show empty state
    if (deadlines.length === 0) {

        emptyBox.style.display = "block";

        return;
    }

    emptyBox.style.display = "none";

    // loop through deadlines
    deadlines.forEach((item, index) => {

        const daysLeft =
            getDaysLeft(item.date);

        // warning border
        let warningClass = "";

        if (daysLeft <= 2 && daysLeft >= 0) {

            warningClass = "deadline-warning";
        }

        // create card
        const div =
            document.createElement("div");

        div.className =
            `card deadline-item ${warningClass}`;

        // auto complete if overdue
        if (daysLeft < 0) {

            item.completed = true;
        }

        // completed style
        if (item.completed) {

            div.classList.add(
                "deadline-completed"
            );
        }

        // ================= CARD HTML =================
        div.innerHTML = `

            <div class="deadline-info">

                <!-- COURSE -->
                <strong class="deadline-title">

                    <img
                        src="../imgs/purpleBook.png"
                        class="mini-icon"
                    >

                    ${item.course}

                </strong>

                <!-- TASK TITLE -->
                <small>

                    ${item.title}

                </small>

                <!-- TYPE + DATE -->
                <small>

                    <img
                        src="${item.type === "Exam"
                ? "../imgs/warning.png"
                : "../imgs/pinkBook.png"
            }"
                        class="mini-icon"
                    >

                    ${item.type} | ${item.date}

                </small>

                <!-- DAYS LEFT -->
                <span class="days-left">

                    <img
                        src="../imgs/hourglass.png"
                        class="mini-icon"
                    >

                    ${item.completed

                ? `

                        <img
                            src="../imgs/success.png"
                            class="mini-icon"
                        >

                        Completed
                        `

                : daysLeft + " days left"
            }

                </span>

            </div>

            <!-- ACTION BUTTONS -->
            <div class="deadline-actions">

                <button class="btn update-btn">
                    Update
                </button>

                <button class="btn delete-btn">
                    Delete
                </button>

            </div>
        `;

        // ================= DOUBLE CLICK COMPLETE =================
        div.addEventListener("dblclick", () => {

            item.completed =
                !item.completed;

            saveData();

            render();

            showToast(

                item.completed
                    ? " Marked as completed"
                    : " Marked as incomplete",

                "success"
            );
        });

        // ================= DELETE =================
        div.querySelector(".delete-btn")
            .addEventListener("click", () => {

                deadlines.splice(index, 1);

                saveData();

                render();

                showToast(
                    " Deadline deleted successfully",
                    "success"
                );
            });

        // ================= OPEN EDIT MODAL =================
        div.querySelector(".update-btn")
            .addEventListener("click", () => {

                currentEditIndex = index;

                editTitle.value =
                    item.title;

                editType.value =
                    item.type;

                editDate.value =
                    item.date;

                modal.style.display = "flex";
            });

        // append card
        container.appendChild(div);
    });
}

// ================= ADD DEADLINE =================
addBtn.addEventListener("click", () => {

    // values
    const course =
        taskCourse.value;

    const title =
        taskName.value.trim();

    const type =
        taskType.value;

    const date =
        taskDate.value;

    // today date
    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    // ================= VALIDATION =================

    // empty fields
    if (!course || !title || !type || !date) {

        showToast(
            " Please complete all fields.",
            "error"
        );

        return;
    }

    // prevent old dates
    if (date < today) {

        showToast(
            " Please choose a future date.",
            "error"
        );

        return;
    }

    // ================= SAVE =================
    deadlines.push({

        course,
        title,
        type,
        date,

        completed: false
    });

    // save
    saveData();

    // rerender
    render();

    // clear inputs
    taskCourse.value = "";

    taskName.value = "";

    taskType.value = "";

    taskDate.value = "";

    // success toast
    showToast(
        " Deadline added successfully!",
        "success"
    );
    if (typeof updateNotifDot === "function") updateNotifDot();
});

// ================= SAVE EDIT =================
saveEditBtn.addEventListener("click", () => {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    // prevent old dates
    if (editDate.value < today) {

        showToast(
            " Please choose a future date.",
            "error"
        );

        return;
    }

    // update values
    deadlines[currentEditIndex].title =
        editTitle.value;

    deadlines[currentEditIndex].type =
        editType.value;

    deadlines[currentEditIndex].date =
        editDate.value;

    // save
    saveData();

    // rerender
    render();

    // close modal
    modal.style.display = "none";

    // success toast
    showToast(
        " Deadline updated successfully!",
        "success"
    );
    if (typeof updateNotifDot === "function") updateNotifDot();
});

// ================= CLOSE MODAL =================
closeModal.addEventListener("click", () => {

    modal.style.display = "none";
});

// ================= CLOSE OUTSIDE MODAL =================
window.addEventListener("click", (e) => {

    if (e.target === modal) {

        modal.style.display = "none";
    }
});
// ================= DARK MODE =================

const themeToggle =
    document.getElementById("themeToggle");

// load saved theme
if (localStorage.getItem("theme") === "dark") {

    document.body.classList.add("dark");
}

// toggle theme
themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    // save mode
    if (document.body.classList.contains("dark")) {

        localStorage.setItem("theme", "dark");

    } else {

        localStorage.setItem("theme", "light");
    }
});

// ================= INITIAL RENDER =================
render();