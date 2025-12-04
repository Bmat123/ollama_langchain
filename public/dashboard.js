document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const username = params.get('user');
  const dashboardTitle = document.getElementById('dashboard-title');
  const planListContainer = document.getElementById('plan-list-container');
  const createPlanBtn = document.getElementById('create-plan-btn');
  const newPlanNameInput = document.getElementById('new-plan-name');
  const newPlanPromptInput = document.getElementById('new-plan-prompt');
  const generationStatus = document.getElementById('generation-status');

  if (!username) {
    window.location.href = '/login.html';
    return;
  }

  dashboardTitle.innerText = `Welcome, ${username}!`;

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/user/${username}/plans`);
      const data = await response.json();

      planListContainer.innerHTML = ''; // Clear loading message

      if (data.plans && data.plans.length > 0) {
        const list = document.createElement('ul');
        list.className = 'plan-list';
        data.plans.forEach(planName => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<a href="/?user=${username}&plan=${planName}">${planName}</a>`;
          list.appendChild(listItem);
        });
        planListContainer.appendChild(list);
      } else {
        planListContainer.innerHTML = '<p>You have no saved plans yet.</p>';
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      planListContainer.innerHTML = '<p>Could not load plans.</p>';
    }
  };

  fetchPlans();

  createPlanBtn.addEventListener('click', async () => {
    const planName = newPlanNameInput.value.trim();
    const userPrompt = newPlanPromptInput.value.trim();

    if (!planName || !userPrompt) {
      alert('Please provide a name and a description for the new plan.');
      return;
    }

    generationStatus.textContent = 'Generating plan... Please wait.';
    generationStatus.style.color = 'orange';

    try {
      const response = await fetch(`/user/${username}/plans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, userPrompt }),
      });

      const result = await response.json();
      generationStatus.textContent = result.message;
      // Optionally, you could set a timer to refresh the plan list
    } catch (error) {
      console.error('Failed to trigger plan generation:', error);
      generationStatus.textContent = 'Error starting plan generation.';
      generationStatus.style.color = 'red';
    }
  });
});