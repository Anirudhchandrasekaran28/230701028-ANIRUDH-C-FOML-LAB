// Password visibility toggle
const passwordInput = document.getElementById('passwordInput');
const togglePasswordBtn = document.getElementById('togglePassword');

togglePasswordBtn.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        this.innerHTML = '<i class="fas fa-eye"></i>';
    }
});

// Login form submission
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    try {
        // Simulated login request
        const response = await simulateLoginRequest(email, password);
        
        if (response.success) {
            window.location.href = "Main_page.html";
            // Redirect to dashboard or home page
        } else {
            alert(response.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
});

// Simulated login request function
async function simulateLoginRequest(email, password) {
    // This is a mock function - replace with actual backend authentication
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            // Basic validation
            if (email && password) {
                // Successful login
                resolve({ success: true });
            } else {
                // Failed login
                resolve({ 
                    success: false, 
                    message: 'Invalid email or password' 
                });
            }
        }, 1000);
    });
}