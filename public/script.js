let nav = 0; // Navigation offset for months
let activities = {}; // To store fetched activities
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
        activities[dayString].forEach(activity => {
          const activityDiv = document.createElement('div');
          activityDiv.classList.add('activity');
          activityDiv.classList.add(`discipline-${activity.discipline.toLowerCase()}`);
          activityDiv.innerText = activity.description;
          activityDiv.addEventListener('click', () => {
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

    calendar.appendChild(daySquare);    
  }
}

function openActivityModal(activity) {
  const modal = document.getElementById('activity-modal');
  document.getElementById('modal-title').innerText = activity.description;
  document.getElementById('modal-status').innerText = activity.done ? 'Completed' : 'Not Completed';
  document.getElementById('modal-discipline').innerText = activity.discipline;
  document.getElementById('modal-duration').innerText = `${activity.plannedDuration} minutes`;

  const distanceEl = document.getElementById('modal-distance');
  if (activity.distance !== undefined) {
    distanceEl.parentElement.style.display = 'block';
    distanceEl.innerText = `${activity.distance} km`;
  } else {
    // Hide distance if it's not applicable (e.g., for Yoga)
    distanceEl.parentElement.style.display = 'none';
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
  const modal = document.getElementById('activity-modal');
  const closeButton = document.querySelector('.close-button');

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

  loadBtn.addEventListener('click', async () => {
    const filename = filenameInput.value.trim();
    if (!filename) {
      alert('Please enter the name of the plan to load.');
      return;
    }
    await fetchDataAndRender(`/load/${filename}`);
  });

  nextButton.addEventListener('click', () => {
    nav++;
    loadCalendar();
  });

  backButton.addEventListener('click', () => {
    nav--;
    loadCalendar();
  });

  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

initButtons();
fetchDataAndRender('/data'); // Fetch initial data and render the calendar
