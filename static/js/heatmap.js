document.addEventListener('DOMContentLoaded', function() {
    // Set a customizable gap between items
    const gridGap = 1; // Very small gap - change this value to adjust spacing
    document.documentElement.style.setProperty('--column-gap', gridGap + 'px');
    
    // Update the timestamp
    updateTimestamp();
    
    // Load bin locations from JSON file
    loadBinLocations();
    
    // Add resize event listener to handle window resizing
    window.addEventListener('resize', function() {
        // Throttle the resize event
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(function() {
            // Reload bin locations to recalculate sizes
            loadBinLocations();
        }, 250);
    });
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
    
    // Analyze the grid structure to determine dimensions
    const grid = analyzeGrid(layoutData.bins);
    
    // Set the columns based on the analysis
    heatmapContainer.style.gridTemplateColumns = `repeat(${grid.columns}, 1fr)`;
    heatmapContainer.style.gridTemplateRows = `repeat(${grid.rows}, 1fr)`;
    
    // Calculate proper bin size based on available space and grid dimensions
    calculateBinSize(grid.columns, grid.rows);
    
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

function analyzeGrid(bins) {
    // Find the maximum row and column values
    let maxRow = 0;
    let maxColumn = 0;
    
    bins.forEach(bin => {
        const row = bin.row || 1;
        const column = bin.column || 1;
        
        maxRow = Math.max(maxRow, row);
        maxColumn = Math.max(maxColumn, column);
    });
    
    return {
        rows: maxRow,
        columns: maxColumn
    };
}

function calculateBinSize(columns, rows) {
    // Get available space
    const container = document.getElementById('heatmap');
    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;
    
    // Calculate optimal bin size
    // Subtract a small amount for gaps and borders
    const gapSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--column-gap')) || 1;
    const totalGapsWidth = gapSize * (columns - 1);
    const totalGapsHeight = gapSize * (rows - 1);
    
    const binWidth = Math.floor((availableWidth - totalGapsWidth) / columns);
    const binHeight = Math.floor((availableHeight - totalGapsHeight) / rows);
    
    // Use the smaller dimension to keep bins square
    const binSize = Math.min(binWidth, binHeight);
    
    // Set the CSS custom property for bin size
    document.documentElement.style.setProperty('--bin-size', binSize + 'px');
    
    // Apply the size to all bins
    const bins = document.querySelectorAll('.bin');
    bins.forEach(bin => {
        bin.style.width = binSize + 'px';
        bin.style.height = binSize + 'px';
        
        // Adjust font size based on bin size
        bin.style.fontSize = Math.max(8, Math.floor(binSize / 4)) + 'px';
    });
}

function showError() {
    const heatmapContainer = document.getElementById('heatmap');
    heatmapContainer.innerHTML = '<div class="error-message">Error loading bin locations. Please try again later.</div>';
}