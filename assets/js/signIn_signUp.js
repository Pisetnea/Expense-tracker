let mode = "signin";

function switchTab(type) {
    mode = type;

    document.querySelectorAll(".tab").forEach(tab =>
        tab.classList.remove("active")
    );

    if (type === "signin") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("submitBtn").textContent = "Sign In";
        document.getElementById("forgot").style.display = "block";
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("submitBtn").textContent = "Sign Up";
        document.getElementById("forgot").style.display = "none";
    }
}

function Password() {
    const pwd = document.getElementById("password");
    pwd.type = pwd.type === "password" ? "text" : "password";
}

const form = document.getElementById("Form");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    if (!email || !password) {
        error.style.display = "block";
        return;
    }

    error.style.display = "none";

    alert(
        mode === "signin"
            ? "Signed in successfully!"
            : "Account created successfully!"
    );
});