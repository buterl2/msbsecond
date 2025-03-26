document.addEventListener('DOMContentLoaded', function() {

    // Set a customizable gap between columns (in pixels)
    const columnGap = 4; // You can change this value to adjust spacing
    document.documentElement.style.setProperty('--column-gap', columnGap + 'px');

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
    heatmapContainer.style.gridTemplateColumns = `repeat(${layoutData.columns}, 1fr)`;
    
    // Apply the custom column gap
    heatmapContainer.style.gap = `var(--column-gap)`;
    
    // Process each bin in the layout
    layoutData.bins.forEach(bin => {
        const binElement = document.createElement('div');
        binElement.className = 'bin';
        binElement.setAttribute('data-location', bin.location);
        binElement.textContent = bin.location;
        
        // Add column information as a data attribute
        binElement.setAttribute('data-column', bin.column);
        
        // Add any status classes if needed
        if (bin.status === 'empty') {
            binElement.classList.add('empty');
        }
        
        // Set grid position if row and column are specified
        if (bin.row && bin.column) {
            binElement.style.gridRow = bin.row;
            binElement.style.gridColumn = bin.column;
        } else if (bin.column) {
            // Backward compatibility: if only column is specified
            binElement.style.gridColumn = bin.column;
        }
        
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