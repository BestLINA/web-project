const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", function () {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser.email === email && savedUser.password === password) {

        alert("Login successful");

        window.location.href = "dashboard.html";

    } else {

        alert("Incorrect email or password");

    }

});