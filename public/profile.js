document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const usernameInput = document.getElementById('username');
  const statusMessage = document.getElementById('status-message');

  // Function to load user data
  const loadUserData = async (username) => {
    if (!username) return;
    try {
      const response = await fetch(`/user/${username}`);
      if (!response.ok) {
        if (response.status === 404) {
          statusMessage.textContent = `No profile found for '${username}'. Please create one.`;
          statusMessage.style.color = 'orange';
        }
        return;
      }
      const user = await response.json();
      document.getElementById('age').value = user.age || '';
      document.getElementById('height').value = user.height || '';
      document.getElementById('weight').value = user.weight || '';
      document.getElementById('run1hResult').value = user.run1hResult || '';
      document.getElementById('cyclingFtp').value = user.cyclingFtp || '';
      document.getElementById('swim100mTime').value = user.swim100mTime || '';
      statusMessage.textContent = `Profile for '${username}' loaded.`;
      statusMessage.style.color = 'green';
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // When the username changes, try to load the data
  usernameInput.addEventListener('blur', () => {
    loadUserData(usernameInput.value.trim());
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) {
      alert('Username is required.');
      return;
    }

    const userData = {
      age: document.getElementById('age').valueAsNumber || undefined,
      height: document.getElementById('height').valueAsNumber || undefined,
      weight: document.getElementById('weight').valueAsNumber || undefined,
      run1hResult: document.getElementById('run1hResult').valueAsNumber || undefined,
      cyclingFtp: document.getElementById('cyclingFtp').valueAsNumber || undefined,
      swim100mTime: document.getElementById('swim100mTime').valueAsNumber || undefined,
    };

    try {
      const response = await fetch(`/user/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      statusMessage.textContent = result.message || 'Profile saved!';
      statusMessage.style.color = 'green';
    } catch (error) {
      statusMessage.textContent = 'Failed to save profile.';
      statusMessage.style.color = 'red';
      console.error('Error saving profile:', error);
    }
  });
});