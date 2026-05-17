const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", function () {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // validate empty fields
    if (!email || !password) {
        showToast(" Please enter email and password.", "error");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const foundUser = users.find(function (user) {
        return user.email === email && user.password === password;
    });

    if (foundUser) {

        localStorage.setItem("currentUser", JSON.stringify(foundUser));

        showToast(" Login successful!", "success");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } else {

        showToast(" Incorrect email or password.", "error");

    }

});

// =========================================
//   HELPER — show a toast notification
//            at the top then fade it out
// =========================================

function showToast(text, type) {
    const toast = document.getElementById("toast");

    const icon = type === "success" ? "../imgs/success.png" : "../imgs/warningRed.png";
    toast.innerHTML = `<img src="${icon}" class="toast-icon"  alt="success icon or warning icon"> ${text}`;

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