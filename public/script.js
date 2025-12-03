let nav = 0; // Navigation offset for months
let activities = {}; // To store fetched activities
let currentUsername = ''; // To store the logged-in user's name
let clickedDate = null; // To store the date string of the clicked activity
const calendar = document.getElementById('calendar-grid');
const monthDisplay = document.getElementById('month-display');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function loadCalendar() {
  const dt = new Date();

  if (nav !== 0) {
    dt.setMonth(new Date().getMonth() + nav);
  }

  const day = dt.getDate();
  const month = dt.getMonth();
  const year = dt.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const paddingDays = weekdays.indexOf(dateString.split(', ')[0]);

  monthDisplay.innerText = `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;
  calendar.innerHTML = '';

  // Render weekdays
  const weekdaysContainer = document.getElementById('weekdays');
  weekdaysContainer.innerHTML = '';
  weekdays.forEach(day => {
    const dayDiv = document.createElement('div');
    dayDiv.innerText = day.substring(0, 3);
    weekdaysContainer.appendChild(dayDiv);
  });

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day-cell');

    if (i > paddingDays) {
      const dayOfMonth = i - paddingDays;
      daySquare.innerText = dayOfMonth;

      const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
      
      if (activities[dayString]) {
        // Sort activities for consistent order
        activities[dayString].sort((a, b) => a.description.localeCompare(b.description));

        activities[dayString].forEach(activity => {
          const activityDiv = document.createElement('div');
          activityDiv.classList.add('activity');
          activityDiv.classList.add(`discipline-${activity.discipline.toLowerCase()}`);
          activityDiv.innerText = activity.description;
          activityDiv.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent day cell click from firing
            openActivityModal(activity);
          });

          daySquare.appendChild(activityDiv);
        });
      }

      if (dayOfMonth === day && nav === 0) {
        daySquare.classList.add('today');
      }
    } else {
      daySquare.classList.add('padding');
    }

    daySquare.addEventListener('click', () => {
      if (i > paddingDays) {
        openAddActivityModal(`${year}-${String(month + 1).padStart(2, '0')}-${String(i - paddingDays).padStart(2, '0')}`);
      }
    });
    calendar.appendChild(daySquare);    
  }
}

function openActivityModal(activity) {
  clickedDate = activity.date.split('T')[0]; // Store the date of the activity being edited
  const modal = document.getElementById('activity-modal');
  document.getElementById('modal-title').innerText = `Edit: ${activity.description}`;
  document.getElementById('modal-description').value = activity.description;
  document.getElementById('modal-status').checked = activity.done;
  document.getElementById('modal-discipline').innerText = activity.discipline;
  document.getElementById('modal-duration').innerText = `${activity.plannedDuration} minutes`;

  const distanceEl = document.getElementById('modal-distance');
  const distanceGroup = document.getElementById('modal-distance-group');
  if (activity.distance !== undefined) {
    distanceGroup.style.display = 'block';
    distanceEl.innerText = `${activity.distance} km`;
  } else {
    // Hide distance if it's not applicable (e.g., for Yoga)
    distanceGroup.style.display = 'none';
  }

  const intervalsContainer = document.getElementById('modal-intervals-container');
  intervalsContainer.innerHTML = ''; // Clear previous intervals

  if (activity.intervals && activity.intervals.length > 0) {
    const intervalsTitle = document.createElement('h3');
    intervalsTitle.innerText = 'Intervals';
    intervalsContainer.appendChild(intervalsTitle);

    const intervalsList = document.createElement('ul');
    intervalsList.className = 'intervals-list';

    activity.intervals.forEach(interval => {
      const listItem = document.createElement('li');
      const status = interval.done ? '✅' : '🔲';
      listItem.innerHTML = `
        ${status} ${interval.repetitions}x ${interval.description} 
        (${interval.duration} min) @ ${interval.intensity} intensity
      `;
      intervalsList.appendChild(listItem);
    });

    intervalsContainer.appendChild(intervalsList);
  }


  modal.style.display = 'flex';
}

function openAddActivityModal(date) {
  const modal = document.getElementById('add-activity-modal');
  document.getElementById('add-activity-date').value = date;
  document.getElementById('add-activity-form').reset();
  modal.style.display = 'flex';
}


async function fetchDataAndRender(url) {
  const statusMessage = document.getElementById('status-message');
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.entriesByDate) {
      activities = data.entriesByDate;
      statusMessage.textContent = data.message || 'Plan loaded.';
      statusMessage.style.color = 'green';
    } else {
      throw new Error('Loaded data is not in the correct format.');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    activities = {}; // Clear activities on error
    statusMessage.textContent = 'Error loading plan.';
    statusMessage.style.color = 'red';
  }
  loadCalendar(); // Render calendar with new data
}

function initButtons() {
  const saveBtn = document.getElementById('save-plan-btn');
  const loadBtn = document.getElementById('load-plan-btn');
  const filenameInput = document.getElementById('plan-filename');
  const statusMessage = document.getElementById('status-message');
  const nextButton = document.getElementById('next-month-btn');
  const backButton = document.getElementById('prev-month-btn');
  const editModal = document.getElementById('activity-modal');
  const addModal = document.getElementById('add-activity-modal');

  // Get username from URL and load their default plan
  const params = new URLSearchParams(window.location.search);
  currentUsername = params.get('user');

  if (currentUsername) {
    document.getElementById('plan-controls').style.display = 'flex';
    // Load a default plan or the last saved plan
    fetchDataAndRender(`/user/${currentUsername}/plan/default-plan`);
  } else {
    // If no user, redirect to login
    window.location.href = '/login.html';
  }

  document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => {
      editModal.style.display = 'none';
      addModal.style.display = 'none';
    });
  });
  const modalForm = document.getElementById('modal-form');

  saveBtn.addEventListener('click', async () => {
    const planName = filenameInput.value.trim();
    if (!planName) {
      alert('Please enter a plan name.');
      return;
    }
    try {
      const response = await fetch(`/user/${currentUsername}/plan/${planName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entriesByDate: activities }),
      });
      if (!response.ok) {
        throw new Error('Failed to save plan.');
      }
      statusMessage.textContent = `Plan '${planName}' saved successfully!`;
      statusMessage.style.color = 'green';
    } catch (error) {
      console.error('Error saving plan:', error);
      statusMessage.textContent = `Error saving plan.`;
      statusMessage.style.color = 'red';
    }
  });

  loadBtn.addEventListener('click', async () => {
    const planName = filenameInput.value.trim();
    if (!planName) {
      alert('Please enter a plan name to load.');
      return;
    }
    await fetchDataAndRender(`/user/${currentUsername}/plan/${planName}`);
  });

  nextButton.addEventListener('click', () => {
    nav++;
    loadCalendar();
  });

  backButton.addEventListener('click', () => {
    nav--;
    loadCalendar();
  });

  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const description = document.getElementById('modal-description').value;
    const isDone = document.getElementById('modal-status').checked;

    // Find and update the activity in our local `activities` object
    const activityToUpdate = activities[clickedDate].find(
      act => act.description === document.getElementById('modal-title').innerText.replace('Edit: ', '')
    );

    if (activityToUpdate) {
      activityToUpdate.description = description;
      activityToUpdate.done = isDone;
    }

    editModal.style.display = 'none';
    loadCalendar(); // Re-render the calendar to show the changes
  });

  const addActivityForm = document.getElementById('add-activity-form');
  addActivityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('add-activity-date').value;
    const newActivity = {
      date: date, // Use the simple 'YYYY-MM-DD' string
      discipline: document.getElementById('add-discipline').value,
      description: document.getElementById('add-description').value,
      plannedDuration: document.getElementById('add-duration').valueAsNumber,
      distance: document.getElementById('add-distance').valueAsNumber,
      done: false,
      intervals: [], // New activities start with no intervals
    };

    if (!activities[date]) {
      activities[date] = [];
    }
    activities[date].push(newActivity);

    addModal.style.display = 'none';
    loadCalendar(); // Re-render to show the new activity
  });
}

initButtons();
