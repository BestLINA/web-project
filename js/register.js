const signupBtn = document.getElementById("signupBtn");

function validatePassword(password) {
    // 8 characters or more
    if (password.length < 8) return false;
    // At least 1 capital letter
    if (!/[A-Z]/.test(password)) return false;
    // At least 1 number
    if (!/[0-9]/.test(password)) return false;
    return true;
}

signupBtn.addEventListener("click", function () {

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // check empty fields
    if (!fullName || !email || !password || !confirmPassword) {
        showToast(" Please fill in all fields.", "error");
        return;
    }

    if (!validatePassword(password)) {
        showToast("Password must be 8+ characters, include 1 capital letter and 1 number.", "error");
        return;
    }

    // password match validation
    if (password !== confirmPassword) {
        showToast(" Passwords do not match.", "error");
        return;
    }

    const user = {
        id: Date.now().toString(),
        fullName: fullName,
        email: email,
        password: password
    };

    let users = JSON.parse(localStorage.getItem("users")) || [];

    // prevent duplicate email
    const emailExists = users.some(user => user.email === email);

    if (emailExists) {
        showToast(" Email already exists.", "error");
        return;
    }

    users.push(user);

    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(user));

    showToast(" Account created successfully!", "success");

    // small delay so user sees the toast
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1500);

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