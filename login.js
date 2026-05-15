const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", function () {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const foundUser = users.find(function (user) {
    return user.email === email && user.password === password;
    });

    if (foundUser) {
        localStorage.setItem("currentUser", JSON.stringify(foundUser));

        alert("Login successful");

        window.location.href = "dashboard.html";

    } else {

        alert("Incorrect email or password");

    }

});