document.addEventListener('DOMContentLoaded', function() {
    // Set a customizable gap between items
    const gridGap = 4;
    document.documentElement.style.setProperty('--column-gap', gridGap + 'px');
    
    // Set a default bin size - will adjust based on content
    const binSize = 30;
    document.documentElement.style.setProperty('--bin-size', binSize + 'px');
    
    // Create tooltip element for hover information
    createTooltip();
    
    // Update the timestamp
    updateTimestamp();
    
    // Load bin locations and activity data
    loadBinDataAndActivity();
    
    // Add resize event listener to handle window resizing
    window.addEventListener('resize', function() {
        // Throttle the resize event
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(function() {
            // Update the layout without changing bin size
            updateLayout();
        }, 250);
    });
});

function createTooltip() {
    // Create tooltip element for bin information on hover
    const tooltip = document.createElement('div');
    tooltip.className = 'bin-tooltip';
    document.body.appendChild(tooltip);
    
    // Add event listeners to track mouse movement for the tooltip
    document.addEventListener('mousemove', function(e) {
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY + 10) + 'px';
    });
}

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

function loadBinDataAndActivity() {
    // First load the bin locations
    fetch('/api/bin_locations')
        .then(response => response.json())
        .then(binData => {
            if (binData.success) {
                // Now fetch the activity data
                fetch('/api/bin_activity')
                    .then(response => response.json())
                    .then(activityData => {
                        if (activityData.success) {
                            // Combine the two datasets and render
                            renderBinLayoutWithActivity(binData.layout, activityData);
                        } else {
                            console.error('Error loading activity data:', activityData.error);
                            // Still render the layout, but without activity data
                            renderBinLayout(binData.layout);
                        }
                    })
                    .catch(error => {
                        console.error('Failed to fetch activity data:', error);
                        // Still render the layout, but without activity data
                        renderBinLayout(binData.layout);
                    });
            } else {
                console.error('Error loading bin locations:', binData.error);
                showError();
            }
        })
        .catch(error => {
            console.error('Failed to fetch bin locations:', error);
            showError();
        });
}

function updateLayout() {
    // Get the existing layout data
    const bins = document.querySelectorAll('.bin');
    if (bins.length === 0) return;
    
    // Get the container
    const heatmapContainer = document.getElementById('heatmap');
    
    // Find maximum row and column
    let maxRow = 0;
    let maxColumn = 0;
    
    bins.forEach(bin => {
        const row = parseInt(bin.getAttribute('data-row')) || 1;
        const column = parseInt(bin.getAttribute('data-column')) || 1;
        
        maxRow = Math.max(maxRow, row);
        maxColumn = Math.max(maxColumn, column);
    });
    
    // Update the grid template
    heatmapContainer.style.gridTemplateColumns = `repeat(${maxColumn}, var(--bin-size))`;
    heatmapContainer.style.gridTemplateRows = `repeat(${maxRow}, var(--bin-size))`;
}

function renderBinLayoutWithActivity(layoutData, activityData) {
    const heatmapContainer = document.getElementById('heatmap');
    const tooltip = document.querySelector('.bin-tooltip');
    
    // Create a map of location to activity count for easy lookup
    const activityMap = {};
    if (activityData && activityData.activity_data) {
        activityData.activity_data.forEach(item => {
            activityMap[item.location] = item.activity_count;
        });
    }
    
    // Get min and max activity for scaling
    const minActivity = activityData.min_activity || 0;
    const maxActivity = activityData.max_activity || 0;
    const totalActivities = activityData.total_activities || 0;
    
    // Clear existing content
    heatmapContainer.innerHTML = '';
    
    // Add a legend for the activity heatmap
    const legendContainer = document.createElement('div');
    legendContainer.className = 'heatmap-legend';
    legendContainer.innerHTML = `
        <div class="legend-title">Activity Heatmap</div>
        <div class="legend-scale">
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--low-activity-color);"></div>
                <div class="legend-label">Low</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--medium-activity-color);"></div>
                <div class="legend-label">Medium</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--high-activity-color);"></div>
                <div class="legend-label">High</div>
            </div>
        </div>
        <div class="legend-info">Total Activities: ${totalActivities}</div>
    `;
    
    // Create a legend holder outside the grid
    const legendHolder = document.createElement('div');
    legendHolder.className = 'legend-holder';
    legendHolder.appendChild(legendContainer);
    heatmapContainer.parentNode.insertBefore(legendHolder, heatmapContainer);
    
    // Analyze the grid structure to determine dimensions
    const grid = analyzeGrid(layoutData.bins);
    
    // Set the columns and rows for the grid
    heatmapContainer.style.gridTemplateColumns = `repeat(${grid.columns}, var(--bin-size))`;
    heatmapContainer.style.gridTemplateRows = `repeat(${grid.rows}, var(--bin-size))`;
    
    // Process each bin in the layout
    layoutData.bins.forEach(bin => {
        const binElement = document.createElement('div');
        binElement.className = 'bin';
        
        // Store location data as attributes
        binElement.setAttribute('data-location', bin.location);
        
        // We still set the text content but it's not visible (useful for internal references)
        binElement.textContent = bin.location;
        
        // Add row and column information as data attributes
        const row = bin.row || 1;
        const column = bin.column || 1;
        binElement.setAttribute('data-row', row);
        binElement.setAttribute('data-column', column);
        
        // Add status class
        if (bin.status === 'empty') {
            binElement.classList.add('empty');
        } else {
            // Add activity level if not empty
            const activityCount = activityMap[bin.location] || 0;
            binElement.setAttribute('data-activity', activityCount);
            
            // Add activity class based on the activity level
            if (activityCount > 0) {
                if (maxActivity > minActivity) {
                    // Calculate normalized activity level (0-100)
                    const activityPercentage = Math.min(100, Math.max(0, 
                        ((activityCount - minActivity) / (maxActivity - minActivity)) * 100
                    ));
                    
                    // Add activity level as a class
                    if (activityPercentage < 33.33) {
                        binElement.classList.add('low-activity');
                    } else if (activityPercentage < 66.66) {
                        binElement.classList.add('medium-activity');
                    } else {
                        binElement.classList.add('high-activity');
                    }
                    
                    // Also set a custom property for fine-grained control
                    binElement.style.setProperty('--activity-level', activityPercentage + '%');
                } else {
                    // If all bins have the same activity, mark as low activity
                    binElement.classList.add('low-activity');
                }
            }
        }
        
        // Set grid position
        binElement.style.gridRow = row;
        binElement.style.gridColumn = column;
        
        // Add hover events to show location and activity information
        binElement.addEventListener('mouseenter', function() {
            const activityCount = activityMap[bin.location] || 0;
            tooltip.innerHTML = `
                <strong>${bin.location}</strong><br>
                Activity: ${activityCount} ${activityCount === 1 ? 'pick' : 'picks'}
            `;
            tooltip.style.display = 'block';
        });
        
        binElement.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });
        
        // Add click event for future functionality
        binElement.addEventListener('click', function() {
            console.log(`Bin ${bin.location} clicked, Activity: ${activityMap[bin.location] || 0}`);
            // You can add more functionality here later
        });
        
        heatmapContainer.appendChild(binElement);
    });
}

function renderBinLayout(layoutData) {
    // This is the fallback if activity data isn't available
    const heatmapContainer = document.getElementById('heatmap');
    const tooltip = document.querySelector('.bin-tooltip');
    
    // Clear existing content
    heatmapContainer.innerHTML = '';
    
    // Analyze the grid structure to determine dimensions
    const grid = analyzeGrid(layoutData.bins);
    
    // Set the columns and rows for the grid
    heatmapContainer.style.gridTemplateColumns = `repeat(${grid.columns}, var(--bin-size))`;
    heatmapContainer.style.gridTemplateRows = `repeat(${grid.rows}, var(--bin-size))`;
    
    // Process each bin in the layout
    layoutData.bins.forEach(bin => {
        const binElement = document.createElement('div');
        binElement.className = 'bin';
        
        // Store location data as attributes
        binElement.setAttribute('data-location', bin.location);
        
        // We still set the text content but it's not visible (useful for internal references)
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
        
        // Add hover events to show location information
        binElement.addEventListener('mouseenter', function() {
            tooltip.textContent = bin.location;
            tooltip.style.display = 'block';
        });
        
        binElement.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });
        
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

function showError() {
    const heatmapContainer = document.getElementById('heatmap');
    heatmapContainer.innerHTML = '<div class="error-message">Error loading bin locations. Please try again later.</div>';
}