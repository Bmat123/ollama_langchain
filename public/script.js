async function fetchData() {
  try {
    const response = await fetch('http://localhost:3000/data'); // Adjust URL if needed
    const data = await response.json();

    const jsonContainer = document.getElementById('json-container');
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2); // Pretty print JSON
    jsonContainer.appendChild(pre);

  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('json-container').textContent = 'Error loading data.';
  }
}

fetchData();
