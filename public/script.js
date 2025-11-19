async function fetchData() {
  try {
    const response = await fetch('http://localhost:3000/data'); // Adjust URL if needed
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = ''; // Clear previous content

    // Get the entries from the data
    const entriesByDate = data.entriesByDate;

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

        listItem.appendChild(checkbox);
        listItem.appendChild(description);
        entriesList.appendChild(listItem);
      });
      dateCard.appendChild(entriesList);

      calendarContainer.appendChild(dateCard);
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('calendar-container').textContent = 'Error loading data.';
  }
}

fetchData();
