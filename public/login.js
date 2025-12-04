document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
      // Check if user exists before redirecting
      fetch(`/user/${username}`)
        .then(response => {
          if (response.ok) {
            // User exists, go to their dashboard
            window.location.href = `/dashboard.html?user=${username}`;
          } else {
            // User does not exist, go to profile creation page
            window.location.href = `/profile.html?user=${username}`;
          }
        })
        .catch(error => console.error('Error checking user:', error));
    }
  });
});