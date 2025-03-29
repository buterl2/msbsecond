document.addEventListener('DOMContentLoaded', function() {
    // Set a customizable gap between columns and rows (in pixels)
    const gridGap = 10; // Very small gap - change this value to adjust spacing
    document.documentElement.style.setProperty('--column-gap', gridGap + 'px');
    
    // Update the timestamp
    updateTimestamp();
    
    // Load bin locations from JSON file
    loadBinLocations();
});

function updateTimestamp() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2); // Get last 2 digits
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const formattedTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    document.getElementById('last-update').textContent = `Last Update: ${formattedTime}`;
}

function loadBinLocations() {
    // Fetch the JSON file with bin layout data
    fetch('/api/bin_locations')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Always use the default layout
                renderBinLayout(data.layout);
            } else {
                console.error('Error loading bin locations:', data.error);
                showError();
            }
        })
        .catch(error => {
            console.error('Failed to fetch bin locations:', error);
            showError();
        });
}

function renderBinLayout(layoutData) {
    const heatmapContainer = document.getElementById('heatmap');
    
    // Clear existing content
    heatmapContainer.innerHTML = '';
    
    // Set the number of columns for the grid
    // We're explicitly setting a fixed number of columns here
    const numColumns = layoutData.columns || 15; // Default to 15 if not specified
    heatmapContainer.style.gridTemplateColumns = `repeat(${numColumns}, min-content)`;
    
    // Create a tracking object for grid positions
    // This helps us place bins correctly in the grid
    const gridPositions = {};
    
    // First pass: determine the grid structure
    layoutData.bins.forEach(bin => {
        const row = bin.row || 1;
        const column = bin.column || 1;
        
        // Track which columns are used in each row
        if (!gridPositions[row]) {
            gridPositions[row] = [];
        }
        gridPositions[row].push(column);
    });
    
    // Process each bin in the layout
    layoutData.bins.forEach(bin => {
        const binElement = document.createElement('div');
        binElement.className = 'bin';
        binElement.setAttribute('data-location', bin.location);
        binElement.textContent = bin.location;
        
        // Add row and column information as data attributes
        const row = bin.row || 1;
        const column = bin.column || 1;
        binElement.setAttribute('data-row', row);
        binElement.setAttribute('data-column', column);
        
        // Add status class
        if (bin.status === 'empty') {
            binElement.classList.add('empty');
        }
        
        // Set grid position
        binElement.style.gridRow = row;
        binElement.style.gridColumn = column;
        
        // Add click event for future functionality
        binElement.addEventListener('click', function() {
            console.log(`Bin ${bin.location} clicked`);
            // You can add more functionality here later
        });
        
        heatmapContainer.appendChild(binElement);
    });
}

function showError() {
    const heatmapContainer = document.getElementById('heatmap');
    heatmapContainer.innerHTML = '<div class="error-message">Error loading bin locations. Please try again later.</div>';
}