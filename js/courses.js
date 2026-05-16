/* =========================
   COURSES SYSTEM
========================= */

document.addEventListener("DOMContentLoaded", () => {
  /* CHECK LOGIN */

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "../html/login.html";
  }

  /* STORAGE KEY */

  const storageKey = "courses_" + currentUser.id;
  /* ELEMENTS */

  const courseCode = document.getElementById("courseCode");

  const courseName = document.getElementById("courseName");

  const courseColor = document.getElementById("courseColor");

  const addCourseBtn = document.getElementById("addCourseBtn");

  const coursesContainer = document.getElementById("coursesContainer");

  const totalCourses = document.getElementById("totalCourses");

  const activeCourse = document.getElementById("activeCourse");

  const emptyState = document.getElementById("emptyState");

  const searchInput = document.getElementById("searchInput");

  /* LOAD COURSES */

  let courses = JSON.parse(localStorage.getItem(storageKey)) || [];
  /* RENDER COURSES */

  function renderCourses(filteredCourses = courses) {
    coursesContainer.innerHTML = "";

    if (filteredCourses.length === 0) {
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
    }

    filteredCourses.forEach((course, index) => {
      const courseCard = document.createElement("div");

      courseCard.classList.add("card", "course-card");

      courseCard.style.borderLeft = `8px solid ${course.color}`;

      courseCard.innerHTML = `

                <div class="course-top">

                    <div>

                        <h2>
                            ${course.code}
                        </h2>

                        <p>
                            ${course.name}
                        </p>

                    </div>

                    

                </div>

                <div class="course-progress">

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="
                            width:${course.progress}%;

                            background:${course.color}"
                        >
                        </div>

                    </div>

                    <p>
                        Progress:
                        ${course.progress}%
                    </p>

                </div>

                <div class="course-actions">

                    <button
                        class="update-btn"
                        data-index="${index}"
                    >
                        Update
                    </button>

                    <button
                        class="delete-btn"
                        data-index="${index}"
                    >
                        Delete
                    </button>

                </div>

            `;

      coursesContainer.appendChild(courseCard);
    });

    updateStatistics();

    addDeleteEvents();

    addUpdateEvents();
  }

  /* ADD COURSE */

  addCourseBtn.addEventListener("click", () => {
    const code = courseCode.value.trim();

    const name = courseName.value.trim();

    /* EMPTY FIELDS */

    if (code === "" || name === "") {
      showToast(" Please fill all fields.", "error");

      return;
    }

    /* DUPLICATE COURSE CODE */

    const duplicateCourse = courses.find(
      (course) => course.code.toLowerCase() === code.toLowerCase(),
    );

    if (duplicateCourse) {
      showToast(" Course code already exists.", "error");

      return;
    }

    /* CREATE COURSE */

    const newCourse = {
      code: code,

      name: name,

      color: courseColor.value,

      progress: Math.floor(Math.random() * 100),
    };

    courses.push(newCourse);

    saveCourses();

    renderCourses();

    /* CLEAR INPUTS */

    courseCode.value = "";

    courseName.value = "";

    /* SUCCESS MESSAGE */

    showToast(" Course added successfully!", "success");
  });

  /* SAVE */

  function saveCourses() {
    localStorage.setItem(
      storageKey,

      JSON.stringify(courses),
    );
  }

  /* DELETE */

  function addDeleteEvents() {
    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = btn.dataset.index;

        const card = btn.closest(".course-card");

        card.style.opacity = "0";

        card.style.transform = "translateX(40px)";

        setTimeout(() => {
          courses.splice(index, 1);

          saveCourses();

          renderCourses();
        }, 300);
      });
    });
  }

  /* UPDATE */

  const editModal = document.getElementById("editModal");

  const editCourseName = document.getElementById("editCourseName");

  const editCourseCode = document.getElementById("editCourseCode");

  const saveEditBtn = document.getElementById("saveEditBtn");

  const closeModal = document.getElementById("closeModal");

  let currentEditIndex = null;

  function addUpdateEvents() {
    const updateButtons = document.querySelectorAll(".update-btn");

    updateButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentEditIndex = btn.dataset.index;

        editCourseName.value = courses[currentEditIndex].name;

        editCourseCode.value = courses[currentEditIndex].code;

        editModal.style.display = "flex";
      });
    });
  }

  /* SAVE EDIT */

  saveEditBtn.addEventListener("click", () => {
    if (
      editCourseName.value.trim() === "" ||
      editCourseCode.value.trim() === ""
    ) {
      return;
    }

    courses[currentEditIndex].name = editCourseName.value;

    courses[currentEditIndex].code = editCourseCode.value;

    saveCourses();

    renderCourses();

    editModal.style.display = "none";
  });

  /* CLOSE MODAL */

  closeModal.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  /* CLOSE WHEN CLICK OUTSIDE */

  window.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });
  /* SEARCH */

  searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.toLowerCase();

    const filteredCourses = courses.filter(
      (course) =>
        course.code.toLowerCase().includes(searchValue) ||
        course.name.toLowerCase().includes(searchValue),
    );

    renderCourses(filteredCourses);
  });

  /* STATISTICS */

  function updateStatistics() {
    totalCourses.innerText = courses.length;

    if (courses.length > 0) {
      activeCourse.innerText = courses[0].code;
    } else {
      activeCourse.innerText = "-";
    }
  }

  /* INITIAL RENDER */

  renderCourses();
});

/* =========================
   TOAST NOTIFICATION
========================= */

function showToast(text, type) {
  let toast = document.getElementById("toast");

  /* CREATE TOAST IF NOT FOUND */

  if (!toast) {
    toast = document.createElement("div");

    toast.id = "toast";

    document.body.appendChild(toast);
  }

  const icon =
    type === "success" ? "../imgs/success.png" : "../imgs/warningRed.png";
  toast.innerHTML = `<img src="${icon}" class="toast-icon" alt=""> ${text}`;

  toast.className = "";

  toast.classList.add("toast");

  toast.classList.add(type === "success" ? "toast-success" : "toast-error");

  toast.classList.add("toast-visible");

  setTimeout(() => {
    toast.classList.remove("toast-visible");
  }, 3000);
}
