// --- STATE MANAGEMENT ---
const state = {
  nav: 0, // Month navigation offset
  activities: {}, // Plan data: { 'YYYY-MM-DD': [activity, ...] }
  currentUsername: '',
  clickedDate: null, // For editing activities
};

// --- DOM ELEMENT CONSTANTS ---
const DOM = {
  calendarGrid: document.getElementById('calendar-grid'),
  monthDisplay: document.getElementById('month-display'),
  weekdaysContainer: document.getElementById('weekdays'),
  statusMessage: document.getElementById('status-message'),
  planControls: document.getElementById('plan-controls'),
  planFilenameInput: document.getElementById('plan-filename'),
  editModal: document.getElementById('activity-modal'),
  addModal: document.getElementById('add-activity-modal'),
  modalForm: document.getElementById('modal-form'),
  addActivityForm: document.getElementById('add-activity-form'),
};

function renderCalendar() {
  const dt = new Date();
  if (state.nav !== 0) {
    dt.setMonth(new Date().getMonth() + state.nav);
  }

  const day = dt.getDate();
  const month = dt.getMonth();
  const year = dt.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
    weekday: 'long',
  });
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const paddingDays = weekdays.indexOf(dateString);

  DOM.monthDisplay.innerText = `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;
  DOM.calendarGrid.innerHTML = '';

  // Render weekdays
  DOM.weekdaysContainer.innerHTML = weekdays.map(day => `<div>${day.substring(0, 3)}</div>`).join('');

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day-cell');
    const dayOfMonth = i - paddingDays;
    const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;

    if (i > paddingDays) {
      const dayNumber = document.createElement('div');
      dayNumber.classList.add('day-number');
      dayNumber.innerText = dayOfMonth;
      daySquare.appendChild(dayNumber);

      const activitiesForDay = state.activities[dayString] || [];
      activitiesForDay.sort((a, b) => a.description.localeCompare(b.description));

      for (const activity of activitiesForDay) {
        const activityDiv = document.createElement('div');
        activityDiv.className = `activity discipline-${activity.discipline.toLowerCase()}`;
        // Combine discipline and description for a more descriptive UI
        if (activity.discipline === 'Rest') {
          activityDiv.innerText = 'Rest Day';
        } else {
          activityDiv.innerText = `${activity.discipline} - ${activity.description}`;
        }
        activityDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          openActivityModal(activity);
        });
        daySquare.appendChild(activityDiv);
      }

      if (dayOfMonth === day && state.nav === 0) {
        daySquare.classList.add('today');
      }
    } else {
      daySquare.classList.add('padding');
    }

    daySquare.addEventListener('click', () => openAddActivityModal(dayString));
    DOM.calendarGrid.appendChild(daySquare);
  }
}

function openActivityModal(activity) {
  state.clickedDate = activity.date.split('T')[0];
  document.getElementById('modal-title').innerText = `Edit: ${activity.description}`;
  document.getElementById('modal-description').value = activity.description;
  document.getElementById('modal-status').checked = activity.done;
  document.getElementById('modal-discipline').innerText = activity.discipline;
  document.getElementById('modal-duration').innerText = `${activity.plannedDuration} minutes`;

  const distanceGroup = document.getElementById('modal-distance-group');
  if (activity.distance !== undefined) {
    distanceGroup.style.display = 'block';
    document.getElementById('modal-distance').innerText = `${activity.distance} km`;
  } else {
    distanceGroup.style.display = 'none';
  }

  const intervalsContainer = document.getElementById('modal-intervals-container');
  intervalsContainer.innerHTML = '';

  if (activity.intervals && activity.intervals.length > 0) {
    const intervalItems = activity.intervals.map(interval => {
      const status = interval.done ? '✅' : '🔲';
      return `<li>${status} ${interval.repetitions}x ${interval.description} (${interval.duration} min) @ ${interval.intensity} intensity</li>`;
    }).join('');

    intervalsContainer.innerHTML = `<h3>Intervals</h3><ul class="intervals-list">${intervalItems}</ul>`;
  }

  showModal(DOM.editModal);
}

function openAddActivityModal(date) {
  if (!date || date.includes('undefined')) return;
  document.getElementById('add-activity-date').value = date;
  DOM.addActivityForm.reset();
  showModal(DOM.addModal);
}

function showModal(modal) { modal.style.display = 'flex'; }
function hideModals() {
  DOM.editModal.style.display = 'none';
  DOM.addModal.style.display = 'none';
}

async function loadPlanData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.entriesByDate) {
      state.activities = data.entriesByDate;
      updateStatus(data.message || 'Plan loaded.', 'green');
    } else {
      throw new Error('Loaded data is not in the correct format.');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    state.activities = {};
    updateStatus('Error loading plan.', 'red');
  }
  renderCalendar();
}

function updateStatus(message, color) {
  DOM.statusMessage.textContent = message;
  DOM.statusMessage.style.color = color;
}

function initButtons() {
  const saveBtn = document.getElementById('save-plan-btn');
  const loadBtn = document.getElementById('load-plan-btn');
  const nextButton = document.getElementById('next-month-btn');
  const backButton = document.getElementById('prev-month-btn');

  // Get username from URL and load their default plan
  const params = new URLSearchParams(window.location.search);
  state.currentUsername = params.get('user');
  const currentPlan = params.get('plan');

  if (state.currentUsername && currentPlan) {
    DOM.planControls.style.display = 'flex';
    // Pre-fill the plan name and load it
    DOM.planFilenameInput.value = currentPlan;
    loadPlanData(`/user/${state.currentUsername}/plan/${currentPlan}`);
  } else {
    // If no user, redirect to login
    window.location.href = '/login.html';
  }

  document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', hideModals);
  });

  saveBtn.addEventListener('click', async () => {
    const planName = DOM.planFilenameInput.value.trim();
    if (!planName) {
      alert('Please enter a plan name.');
      return;
    }
    try {
      const response = await fetch(`/user/${state.currentUsername}/plan/${planName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entriesByDate: state.activities }),
      });
      if (!response.ok) {
        throw new Error('Failed to save plan.');
      }
      updateStatus(`Plan '${planName}' saved successfully!`, 'green');
    } catch (error) {
      console.error('Error saving plan:', error);
      updateStatus('Error saving plan.', 'red');
    }
  });

  loadBtn.addEventListener('click', async () => {
    const planName = DOM.planFilenameInput.value.trim();
    if (!planName) {
      alert('Please enter a plan name to load.');
      return;
    }
    await loadPlanData(`/user/${state.currentUsername}/plan/${planName}`);
  });

  nextButton.addEventListener('click', () => {
    state.nav++;
    renderCalendar();
  });

  backButton.addEventListener('click', () => {
    state.nav--;
    renderCalendar();
  });

  DOM.modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const description = document.getElementById('modal-description').value;
    const isDone = document.getElementById('modal-status').checked;

    // Find and update the activity in our local `activities` object
    const activityToUpdate = state.activities[state.clickedDate].find(
      act => act.description === document.getElementById('modal-title').innerText.replace('Edit: ', '')
    );

    if (activityToUpdate) {
      activityToUpdate.description = description;
      activityToUpdate.done = isDone;
    }

    hideModals();
    renderCalendar();
  });

  DOM.addActivityForm.addEventListener('submit', (e) => {
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

    if (!state.activities[date]) {
      state.activities[date] = [];
    }
    state.activities[date].push(newActivity);

    hideModals();
    renderCalendar();
  });
}

initButtons();
