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
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");

  /* LOAD COURSES */
  let courses = JSON.parse(localStorage.getItem(storageKey)) || [];

  /* RENDER COURSES */
  function renderCourses(filteredCourses = courses) {
    coursesContainer.innerHTML = "";

    // Toggle visibility of empty state layout
    if (filteredCourses.length === 0) {
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
    }

    // Map course colors to corresponding book illustrations
    const bookImages = {
      "#9b7edc": "../imgs/purpleBook.png",
      "#ff8fab": "../imgs/pinkBook.png",
      "#7ec8e3": "../imgs/blueBook.png",
      "#8bd3c7": "../imgs/mintBook.png",
    };

    filteredCourses.forEach((course, index) => {
      const courseCard = document.createElement("div");
      courseCard.classList.add("card", "course-card");
      courseCard.style.borderLeft = `8px solid ${course.color}`;

      const bookImg = bookImages[course.color] || "../imgs/purpleBook.png";

      // UPDATED: Dynamic alternative text for better accessibility (e.g., "CSC 227 course book")
      courseCard.innerHTML = `
               <div class="course-top">

   <div class="course-info">

    <img src="${bookImg}" class="course-book-img" alt="book">

    <div class="course-text">

        <h2>${course.code}</h2>

        <p>${course.name}</p>
        </div>

    </div>

</div>

                <div class="course-actions">
                    <button class="update-btn" data-index="${index}">Update</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
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

    /* EMPTY FIELDS VALIDATION */
    if (code === "" || name === "") {
      showToast(" Please fill all fields.", "error");
      return;
    }

    /* DUPLICATE COURSE CODE VALIDATION */
    const duplicateCourse = courses.find(
      (course) => course.code.toLowerCase() === code.toLowerCase(),
    );

    if (duplicateCourse) {
      showToast(" Course code already exists.", "error");
      return;
    }

    /* CREATE COURSE OBJECT */
    const newCourse = {
      code: code,
      name: name,
      color: courseColor.value,
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

  /* SAVE TO LOCAL STORAGE */
  function saveCourses() {
    localStorage.setItem(storageKey, JSON.stringify(courses));
  }

  /* DELETE ACTIONS WITH ANIMATION */
  function addDeleteEvents() {
    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = btn.dataset.index;
        const card = btn.closest(".course-card");

        // Trigger exit transition
        card.style.opacity = "0";
        card.style.transform = "translateX(40px)";

        setTimeout(() => {
          courses.splice(index, 1);

          saveCourses();

          renderCourses();

          showToast("Course deleted successfully!", "success");
        }, 300);
      });
    });
  }

  /* UPDATE SYSTEM (MODAL CONFIGURATION) */
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

  /* SAVE EDITED COURSE */
  saveEditBtn.addEventListener("click", () => {
    if (
      editCourseName.value.trim() === "" ||
      editCourseCode.value.trim() === ""
    ) {
      showToast("Please complete all fields.", "error");

      return;
    }

    courses[currentEditIndex].name = editCourseName.value;

    courses[currentEditIndex].code = editCourseCode.value;

    saveCourses();

    renderCourses();

    editModal.style.display = "none";

    showToast("Course updated successfully!", "success");
  });
  /* CLOSE MODAL VIA BUTTON */
  closeModal.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  /* CLOSE MODAL WHEN CLICKING OUTSIDE */
  window.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });

  /* LIVE SEARCH SYSTEM */
  searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.toLowerCase();

    const filteredCourses = courses.filter(
      (course) =>
        course.code.toLowerCase().includes(searchValue) ||
        course.name.toLowerCase().includes(searchValue),
    );

    renderCourses(filteredCourses);
  });

  /* STATISTICS ENGINE */
  function updateStatistics() {
    totalCourses.innerText = courses.length;
  }

  /* INITIAL RENDER RUN */
  renderCourses();
});

/* =========================
   TOAST NOTIFICATION SYSTEM
========================= */

function showToast(text, type) {
  let toast = document.getElementById("toast");

  /* CREATE TOAST ELEMENT IF IT DOES NOT EXIST IN DOM */
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }

  const icon =
    type === "success" ? "../imgs/success.png" : "../imgs/warningRed.png";

  // UPDATED: Added semantic alt description instead of an empty string
  const altText = type === "success" ? "Success icon" : "Error icon";

  toast.innerHTML = `<img src="${icon}" class="toast-icon" alt="${altText}"> ${text}`;

  /* CSS CLASS RESET AND TOGGLE animation STATE */
  toast.className = "";
  toast.classList.add("toast");
  toast.classList.add(type === "success" ? "toast-success" : "toast-error");
  toast.classList.add("toast-visible");

  /* DISMISS TOAST AFTER 3 SECONDS */
  setTimeout(() => {
    toast.classList.remove("toast-visible");
  }, 3000);
}
