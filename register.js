const signupBtn = document.getElementById("signupBtn");

signupBtn.addEventListener("click", function () {

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const user = {
        fullName: fullName,
        email: email,
        password: password
    };

let users = JSON.parse(localStorage.getItem("users")) || [];

users.push(user);

localStorage.setItem("users", JSON.stringify(users));
localStorage.setItem("currentUser", JSON.stringify(user));
    alert("Account created successfully");

window.location.href = "dashboard.html";});