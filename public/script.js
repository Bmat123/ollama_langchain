document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('save-plan-btn');
  const loadBtn = document.getElementById('load-plan-btn');
  const filenameInput = document.getElementById('plan-filename');
  const statusMessage = document.getElementById('status-message');

  // Fetch initial data on page load
  fetchData('/data');

  saveBtn.addEventListener('click', async () => {
    const filename = filenameInput.value.trim();
    if (!filename) {
      alert('Please enter a name for the plan.');
      return;
    }
    try {
      const response = await fetch(`/save/${filename}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to save plan.');
      }
      statusMessage.textContent = `Plan '${filename}' saved successfully!`;
      statusMessage.style.color = 'green';
    } catch (error) {
      console.error('Error saving plan:', error);
      statusMessage.textContent = `Error saving plan '${filename}'.`;
      statusMessage.style.color = 'red';
    }
  });

  loadBtn.addEventListener('click', () => {
    const filename = filenameInput.value.trim();
    if (!filename) {
      alert('Please enter the name of the plan to load.');
      return;
    }
    fetchData(`/load/${filename}`);
  });
});

async function fetchData(url) {
  const statusMessage = document.getElementById('status-message');
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.entriesByDate) {
      renderPlan(data.entriesByDate);
      statusMessage.textContent = data.message || 'Plan loaded.';
      statusMessage.style.color = 'green';
    } else {
      throw new Error('Loaded data is not in the correct format.');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    statusMessage.textContent = 'Error loading plan.';
    statusMessage.style.color = 'red';
    document.getElementById('calendar-container').textContent = 'Error loading data.';
  }
}

function renderPlan(entriesByDate) {
  const calendarContainer = document.getElementById('calendar-container');
  calendarContainer.innerHTML = ''; // Clear previous content

  if (Object.keys(entriesByDate).length === 0) {
    calendarContainer.textContent = 'This training plan is empty.';
    return;
  }

  // Loop through each date in the entries object
  for (const date in entriesByDate) {
    // Create the main card for the date
    const dateCard = document.createElement('div');
    dateCard.className = 'date-card';

    // Create the title for the date
    const dateTitle = document.createElement('h2');
    dateTitle.className = 'date-title';
    dateTitle.textContent = new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    dateCard.appendChild(dateTitle);

    // Create the list for the entries
    const entriesList = document.createElement('ul');
    entriesList.className = 'entries-list';
    entriesByDate[date].forEach(entry => {
      const listItem = document.createElement('li');
      // Add a class based on the discipline for styling
      listItem.classList.add(`discipline-${entry.discipline.toLowerCase()}`);

      // Create a checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = entry.done;
      checkbox.disabled = true; // For display only

      // Create a span for the description text
      const description = document.createElement('span');
      description.textContent = entry.description;

      // Create a span for the planned duration
      const durationSpan = document.createElement('span');
      durationSpan.className = 'planned-duration';
      durationSpan.textContent = ` (${entry.plannedDuration} min)`; // Display duration in minutes

      listItem.appendChild(checkbox);
      listItem.appendChild(description);
      listItem.appendChild(durationSpan);
      entriesList.appendChild(listItem);
    });
    dateCard.appendChild(entriesList);

    calendarContainer.appendChild(dateCard);
  }
}
