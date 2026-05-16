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

 // Form validation
 const signupForm = document.getElementById('signupForm');
 const termsCheckbox = document.getElementById('termsCheckbox');

 signupForm.addEventListener('submit', function(e) {
     e.preventDefault();
     
     if (!termsCheckbox.checked) {
         alert('Please agree to the Terms & Conditions');
         return;
     }

     // Here you would typically handle form submission,
     // such as sending data to a backend server
     alert('Account creation submitted!');
 });