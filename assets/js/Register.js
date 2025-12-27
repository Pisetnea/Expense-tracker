function showSignUp() {
    document.querySelector(".container .card").classList.add("hidden");
    document.getElementById("signup-card").classList.remove("hidden");
}

function showSignIn() {
    document.querySelector(".container .card").classList.remove("hidden");
    document.getElementById("signup-card").classList.add("hidden");
}

function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
}