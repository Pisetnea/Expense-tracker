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

// sign-in form submission handling
const signInForm = document.getElementById('signin-form');

signInForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const errorMessage = document.getElementById('errorMessage');
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const loggedInUser = localStorage.getItem("currentUser");
    const currentUser = localStorage.getItem("currentUser");
    errorMessage.textContent = '';

    if (!email || !password) {
        errorMessage.textContent = 'Please fill in all fields.';
        return;
    }

    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        errorMessage.textContent = 'Invalid username or password.';
        return;
    }
    // Successful login
    localStorage.setItem("currentUser", email);
    localStorage.setItem("currentUsername", user.username);
    // Redirect to dashboard
    window.location.href = "dashboard.html";

});

// signup-form submission handling
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', function (event) {
    event.preventDefault(); 

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const username = document.getElementById('signup-username').value;
    const confirmpassword = document.getElementById('signup-confirm-password').value;

    // const errorMessage = document.getElementById('errorMessage');
    // const successMessage = document.getElementById('successMessage');
    // errorMessage.textContent = '';
    // successMessage.textContent = '';

    // let passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordPattern.test(password)) {
    //     alert("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
    //     return;
    // }
    // let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailPattern.test(email)) {
    //     alert("Please enter a valid email address");
    //     return;
    // }

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const userExists = users.some(user => user.email === email);
    if (userExists) {
        alert("Email already exists");
        return;
    }
    if (password !== confirmpassword) {
        alert("Passwords do not match");
        return;
    }

    // Save new user
    users.push({ email, password, username }); 
    localStorage.setItem("users", JSON.stringify(users));

    // Auto login after signup
    localStorage.setItem("currentUser", email);
    localStorage.setItem("currentUsername", username);

    // Redirect to dashboard
    window.location.href = "dashboard.html";
});

