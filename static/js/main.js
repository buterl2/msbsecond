document.addEventListener('DOMContentLoaded', function() {
    // Initial data load
    fetchAndUpdateData();
    fetchPgidLinesData();
    
    // Set up interval to check for new data every 30 seconds
    setInterval(fetchAndUpdateData, 30000);

    document.getElementById('btn-cdhdr-interval-chart').addEventListener('click', function() {
        setActiveCdhrChartButton(this);
        currentCdhrChartType = 'interval';
        updateCdhrChart(lastCdhrData);
    });
    
    document.getElementById('btn-cdhdr-hourly-chart').addEventListener('click', function() {
        setActiveCdhrChartButton(this);
        currentCdhrChartType = 'hourly';
        updateCdhrChart(lastCdhrData);
    });
    
    // Load the CDHDR data on page load
    fetchCdhrData();

    document.getElementById('btn-zu-interval-chart').addEventListener('click', function() {
        setActiveZuChartButton(this);
        currentZuChartType = 'interval';
        // Remove pagination controls when switching to interval view
        removeZuPaginationControls();
        updateZuHistoryChart(lastZuData);
    });
    
    document.getElementById('btn-zu-hourly-chart').addEventListener('click', function() {
        setActiveZuChartButton(this);
        currentZuChartType = 'hourly';
        // Remove pagination controls when switching to hourly view
        removeZuPaginationControls();
        updateZuHistoryChart(lastZuData);
    });
    
    document.getElementById('btn-zu-palletizer-chart').addEventListener('click', function() {
        setActiveZuChartButton(this);
        currentZuChartType = 'palletizer';
        currentZuPalletizerPage = 0; // Reset to first page when switching to palletizer view
        updateZuHistoryChart(lastZuData);
        // Pagination controls are added in the createZuPalletizerChart function
    });
    
    // Load the ZU History data on page load
    fetchZuHistoryData();
    
    // Set up event listeners for chart selector buttons
    document.getElementById('btn-interval-chart').addEventListener('click', function() {
        setActiveChartButton(this);
        currentChartType = 'interval';
        // Remove pagination controls when switching to interval view
        removePaginationControls();
        updateLtapChart(lastLtapData);
    });
    
    document.getElementById('btn-hourly-chart').addEventListener('click', function() {
        setActiveChartButton(this);
        currentChartType = 'hourly';
        // Remove pagination controls when switching to hourly view
        removePaginationControls();
        updateLtapChart(lastLtapData);
    });
    
    document.getElementById('btn-picker-chart').addEventListener('click', function() {
        setActiveChartButton(this);
        currentChartType = 'picker';
        currentPickerPage = 0; // Reset to first page when switching to picker view
        updateLtapChart(lastLtapData);
        // Pagination controls are added in the createPickerChart function
    });

    document.getElementById('toggle-day-button').addEventListener('click', toggleDay);
});

function removePaginationControls() {
    const existingPagination = document.getElementById('picker-pagination');
    if (existingPagination) {
        existingPagination.remove();
    }
}

function removeZuPaginationControls() {
    const existingPagination = document.getElementById('zu-palletizer-pagination');
    if (existingPagination) {
        existingPagination.remove();
    }
}

function setActiveZuChartButton(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll('.zu-history-chart-container .chart-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Add active class to selected button
    activeButton.classList.add('active');
}

function fetchZuHistoryData() {
    // Fetch ZU History statistics data
    fetch('/api/zu_history_statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                lastZuData = data; // Store the data for later use
                updateZuHistoryChart(data);
            } else {
                console.error('Error loading ZU History statistics:', data.error);
            }
        })
        .catch(error => {
            console.error('Failed to fetch ZU History statistics:', error);
        });
}

function updateZuHistoryChart(data) {
    if (!data || !data.data) {
        console.error('Invalid ZU History data structure');
        return;
    }
    
    // Update the total boxes count
    const totalBoxes = data.data.total_boxes || 0;
    document.getElementById('total-palletized-count').textContent = totalBoxes.toLocaleString();

    // If chart already exists, destroy it
    if (zuHistoryChart) {
        zuHistoryChart.destroy();
    }
    
    // Remove any existing peak indicators
    const existingIndicators = document.querySelectorAll('.zu-peak-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Get canvas element
    const ctx = document.getElementById('zu-history-chart').getContext('2d');
    
    // Choose the right chart based on current selection
    switch(currentZuChartType) {
        case 'interval':
            createZuIntervalChart(ctx, data.data);
            break;
        case 'hourly':
            createZuHourlyChart(ctx, data.data);
            break;
        case 'palletizer':
            createZuPalletizerChart(ctx, data.data);
            break;
        default:
            createZuIntervalChart(ctx, data.data);
    }
}

function createZuIntervalChart(ctx, zuData) {
    // Extract data from intervals
    const timeLabels = [];
    const boxCounts = [];
    
    // Get the intervals data
    zuData.intervals.forEach(interval => {
        // Format time labels (just show the end time)
        const endTime = interval.interval_end.split(':').slice(0, 2).join(':');
        timeLabels.push(endTime);
        boxCounts.push(interval.box_count);
    });
    
    // Find peak value and its index
    const peakValue = Math.max(...boxCounts);
    const peakIndex = boxCounts.indexOf(peakValue);
    
    // Create chart
    zuHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Boxes per Interval',
                    data: boxCounts,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',  // Green with transparency
                    borderColor: '#4caf50',                     // Solid green for line
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#4caf50'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30, // Extra padding for peak indicator
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff',
                        // Show only labels for times ending in :00 or :30
                        callback: function(value, index, values) {
                            const label = timeLabels[index];
                            if (!label) return '';
                            
                            const parts = label.split(':');
                            if (parts.length === 2) {
                                const minutes = parts[1];
                                // Only show labels for times ending in :00 or :30
                                if (minutes === '00' || minutes === '30') {
                                    return label;
                                }
                            }
                            return '';  // Return empty string for labels we want to hide
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Boxes',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Boxes: ${context.raw}`;
                        }
                    }
                }
            },
            animation: {
                onComplete: function() {
                    // After animation is complete, add peak indicator
                    if (peakValue > 0) {
                        try {
                            const chart = this.chart;
                            const dataset = chart.data.datasets[0];
                            const meta = chart.getDatasetMeta(0);
                            
                            // Check if meta.data exists and has the necessary point
                            if (meta && meta.data && meta.data[peakIndex]) {
                                const point = meta.data[peakIndex];
                                const rect = chart.canvas.getBoundingClientRect();
                                
                                // Get position of the peak point
                                const x = point.x;
                                const y = point.y;
                                
                                // Create indicator element
                                const indicator = document.createElement('div');
                                indicator.className = 'zu-peak-indicator';
                                indicator.textContent = `Peak: ${peakValue} boxes`;
                                indicator.style.left = `${rect.left + x}px`;
                                indicator.style.top = `${rect.top + y - 40}px`;
                                indicator.style.transform = 'translateX(-50%)';
                                
                                // Add to DOM
                                document.body.appendChild(indicator);
                            }
                        } catch (e) {
                            console.warn('Could not add peak indicator', e);
                        }
                    }
                }
            }
        }
    });
}

function createZuHourlyChart(ctx, zuData) {
    // Group data by hour
    const hourlyData = {};
    
    // Process intervals and group by hour
    zuData.intervals.forEach(interval => {
        const hour = interval.interval_end.split(':')[0];
        const hourKey = `${hour}:00`;
        
        if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = 0;
        }
        
        hourlyData[hourKey] += interval.box_count;
    });
    
    // Convert to arrays for chart
    const hourLabels = Object.keys(hourlyData).sort();
    const hourlyBoxes = hourLabels.map(hour => hourlyData[hour]);
    
    // Create chart
    zuHistoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [
                {
                    label: 'Boxes per Hour',
                    data: hourlyBoxes,
                    backgroundColor: '#4caf50',     // Green for bars
                    borderColor: '#388e3c',         // Darker green for border
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Boxes',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Boxes: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function createZuPalletizerChart(ctx, zuData) {
    // Make sure users array exists and is not empty
    if (!zuData.users || zuData.users.length === 0) {
        console.error('No palletizer data available');
        return;
    }
    
    // Sort palletizers by total boxes (descending)
    const sortedPalletizers = [...zuData.users].sort((a, b) => b.box_count - a.box_count);
    
    // Get total number of pages
    const totalPages = Math.ceil(sortedPalletizers.length / palletizersPerPage);
    
    // Ensure current page is valid
    if (currentZuPalletizerPage >= totalPages) {
        currentZuPalletizerPage = 0;
    }
    
    // Get palletizers for current page
    const startIndex = currentZuPalletizerPage * palletizersPerPage;
    const endIndex = Math.min(startIndex + palletizersPerPage, sortedPalletizers.length);
    const currentPagePalletizers = sortedPalletizers.slice(startIndex, endIndex);
    
    // Extract data
    const palletizerLabels = currentPagePalletizers.map(p => p.user);
    const palletizerBoxCounts = currentPagePalletizers.map(p => p.box_count);
    
    // Create chart
    zuHistoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: palletizerLabels,
            datasets: [
                {
                    label: 'Boxes per Palletizer',
                    data: palletizerBoxCounts,
                    backgroundColor: '#4caf50',
                    borderColor: '#388e3c',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of Boxes',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Palletizer',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    enabled: true
                }
            }
        }
    });
    
    // After chart is rendered, add pagination controls if needed
    if (totalPages > 1) {
        // Remove existing pagination controls
        const existingPagination = document.getElementById('zu-palletizer-pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        // Create pagination container
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'zu-palletizer-pagination';
        paginationContainer.className = 'zu-pagination-container';
        
        // Add prev button
        const prevButton = document.createElement('button');
        prevButton.className = 'zu-pagination-button';
        prevButton.innerHTML = '&laquo; Prev';
        prevButton.disabled = currentZuPalletizerPage === 0;
        prevButton.addEventListener('click', function() {
            if (currentZuPalletizerPage > 0) {
                currentZuPalletizerPage--;
                updateZuHistoryChart(lastZuData);
            }
        });
        
        // Add page indicator
        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'zu-page-indicator';
        pageIndicator.textContent = `Page ${currentZuPalletizerPage + 1} of ${totalPages}`;
        
        // Add next button
        const nextButton = document.createElement('button');
        nextButton.className = 'zu-pagination-button';
        nextButton.innerHTML = 'Next &raquo;';
        nextButton.disabled = currentZuPalletizerPage === totalPages - 1;
        nextButton.addEventListener('click', function() {
            if (currentZuPalletizerPage < totalPages - 1) {
                currentZuPalletizerPage++;
                updateZuHistoryChart(lastZuData);
            }
        });
        
        // Assemble pagination controls
        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageIndicator);
        paginationContainer.appendChild(nextButton);
        
        // Add to DOM - place right below the chart
        const chartContainer = document.querySelector('.zu-history-chart-container .chart-container');
        chartContainer.appendChild(paginationContainer);
    }
}

function fetchPgidLinesData() {
    fetch('/api/pgid_lines_statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updatePgidLinesDisplay(data.data);
            } else {
                console.error('Error loading PGID Lines statistics:', data.error);
                displayPgidLinesError();
            }
        })
        .catch(error => {
            console.error('Failed to fetch PGID Lines statistics:', error);
            displayPgidLinesError();
        });
}

// Function to update the PGID Lines display with data
function updatePgidLinesDisplay(data) {
    // Update Deliveries PGI count
    const totalDeliveries = data.total_deliveries || 0;
    document.getElementById('deliveries-pgi').textContent = totalDeliveries.toLocaleString();
    
    // Update PGI Lines count
    const totalLines = data.total_lines || 0;
    document.getElementById('pgi-lines').textContent = totalLines.toLocaleString() + ' LINES';
}

// Function to display error in PGID Lines data
function displayPgidLinesError() {
    document.getElementById('deliveries-pgi').textContent = 'Error';
    document.getElementById('pgi-lines').textContent = 'Error';
}

function setActiveCdhrChartButton(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll('.cdhdr-chart-container .chart-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Add active class to selected button
    activeButton.classList.add('active');
}

function updateCdhrChart(data) {
    if (!data || !data.data) {
        console.error('Invalid CDHDR data structure');
        return;
    }
    
    // Update the total boxes count
    const totalBoxes = data.data.total_boxes || 0;
    document.getElementById('total-boxes-count').textContent = totalBoxes.toLocaleString();

    // If chart already exists, destroy it
    if (cdhrChart) {
        cdhrChart.destroy();
    }
    
    // Remove any existing peak indicators
    const existingIndicators = document.querySelectorAll('.cdhdr-peak-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Get canvas element
    const ctx = document.getElementById('cdhdr-chart').getContext('2d');
    
    // Choose the right chart based on current selection
    switch(currentCdhrChartType) {
        case 'interval':
            createCdhrIntervalChart(ctx, data.data);
            break;
        case 'hourly':
            createCdhrHourlyChart(ctx, data.data);
            break;
        default:
            createCdhrIntervalChart(ctx, data.data);
    }
}

function createCdhrIntervalChart(ctx, cdhrData) {
    // Extract data from intervals
    const timeLabels = [];
    const boxCounts = [];
    
    // Get the intervals data
    cdhrData.intervals.forEach(interval => {
        // Format time labels (just show the end time)
        const endTime = interval.interval_end.split(':').slice(0, 2).join(':');
        timeLabels.push(endTime);
        boxCounts.push(interval.box_count);
    });
    
    // Find peak value and its index
    const peakValue = Math.max(...boxCounts);
    const peakIndex = boxCounts.indexOf(peakValue);
    
    // Create chart
    cdhrChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Boxes per Interval',
                    data: boxCounts,
                    backgroundColor: 'rgba(233, 30, 99, 0.2)',  // Red with transparency
                    borderColor: '#e91e63',                     // Solid red for line
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#e91e63'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30, // Extra padding for peak indicator
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff',
                        // Show only labels for times ending in :00 or :30
                        callback: function(value, index, values) {
                            const label = timeLabels[index];
                            if (!label) return '';
                            
                            const parts = label.split(':');
                            if (parts.length === 2) {
                                const minutes = parts[1];
                                // Only show labels for times ending in :00 or :30
                                if (minutes === '00' || minutes === '30') {
                                    return label;
                                }
                            }
                            return '';  // Return empty string for labels we want to hide
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Boxes',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Boxes: ${context.raw}`;
                        }
                    }
                }
            },
            animation: {
                onComplete: function() {
                    // After animation is complete, add peak indicator
                    if (peakValue > 0) {
                        try {
                            const chart = this.chart;
                            const dataset = chart.data.datasets[0];
                            const meta = chart.getDatasetMeta(0);
                            
                            // Check if meta.data exists and has the necessary point
                            if (meta && meta.data && meta.data[peakIndex]) {
                                const point = meta.data[peakIndex];
                                const rect = chart.canvas.getBoundingClientRect();
                                
                                // Get position of the peak point
                                const x = point.x;
                                const y = point.y;
                                
                                // Create indicator element
                                const indicator = document.createElement('div');
                                indicator.className = 'cdhdr-peak-indicator';
                                indicator.textContent = `Peak: ${peakValue} boxes`;
                                indicator.style.left = `${rect.left + x}px`;
                                indicator.style.top = `${rect.top + y - 40}px`;
                                indicator.style.transform = 'translateX(-50%)';
                                
                                // Add to DOM
                                document.body.appendChild(indicator);
                            }
                        } catch (e) {
                            console.warn('Could not add peak indicator', e);
                        }
                    }
                }
            }
        }
    });
}

function createCdhrHourlyChart(ctx, cdhrData) {
    // Group data by hour
    const hourlyData = {};
    
    // Process intervals and group by hour
    cdhrData.intervals.forEach(interval => {
        const hour = interval.interval_end.split(':')[0];
        const hourKey = `${hour}:00`;
        
        if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = 0;
        }
        
        hourlyData[hourKey] += interval.box_count;
    });
    
    // Convert to arrays for chart
    const hourLabels = Object.keys(hourlyData).sort();
    const hourlyBoxes = hourLabels.map(hour => hourlyData[hour]);
    
    // Create chart
    cdhrChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [
                {
                    label: 'Boxes per Hour',
                    data: hourlyBoxes,
                    backgroundColor: '#e91e63',     // Red for bars
                    borderColor: '#c2185b',         // Darker red for border
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Boxes',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Boxes: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function fetchCdhrData() {
    // Fetch CDHDR statistics data
    fetch('/api/cdhdr_statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                lastCdhrData = data; // Store the data for later use
                updateCdhrChart(data);
            } else {
                console.error('Error loading CDHDR statistics:', data.error);
            }
        })
        .catch(error => {
            console.error('Failed to fetch CDHDR statistics:', error);
        });
}

function toggleDay() {
    showingTomorrow = !showingTomorrow;
    const button = document.getElementById('toggle-day-button');
    
    if (showingTomorrow) {
        button.textContent = 'Show Today';
        button.classList.add('tomorrow-active');
        
        // If we already have tomorrow's data, display it
        if (tomorrowData) {
            displayDayData(tomorrowData, true);
        } else {
            // Otherwise, fetch it
            fetchTomorrowData();
        }
    } else {
        button.textContent = 'Show Tomorrow';
        button.classList.remove('tomorrow-active');
        
        // Display today's data (which we should already have)
        if (todayData) {
            displayDayData(todayData, false);
        } else {
            // If somehow we don't have today's data, fetch it
            fetchAndUpdateData();
        }
    }
}

function getNextWorkingDay() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // If tomorrow is Saturday (6) or Sunday (0), skip to Monday
    const dayOfWeek = tomorrow.getDay();
    if (dayOfWeek === 6) { // Saturday
        tomorrow.setDate(tomorrow.getDate() + 2); // Skip to Monday
    } else if (dayOfWeek === 0) { // Sunday
        tomorrow.setDate(tomorrow.getDate() + 1); // Skip to Monday
    }
    
    return tomorrow;
}

function fetchTomorrowData() {
    // Get next working day
    const nextWorkDay = getNextWorkingDay();
    const nextWorkDayFormatted = nextWorkDay.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Show loading state
    document.getElementById('open-deliveries').textContent = 'Loading...';
    document.getElementById('open-hu').textContent = 'Loading...';
    document.getElementById('open-lines').textContent = 'Loading...';
    document.getElementById('open-picked-lines').textContent = 'Loading...';
    document.getElementById('open-lines-not-picked').textContent = 'Loading...';
    document.getElementById('lines-per-hu').textContent = 'Loading...';
    document.getElementById('picked-percentage').textContent = 'Loading...';
    document.getElementById('not-picked-percentage').textContent = 'Loading...';
    document.getElementById('total-quantity').textContent = 'Loading...';
    
    // Make API request for statistics data
    fetch('/api/statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                tomorrowData = data;
                
                // Find data for tomorrow's date
                let tomorrowStats = null;
                const tomorrow = nextWorkDayFormatted;
                
                if (data.data && data.data.by_date) {
                    for (const dateEntry of data.data.by_date) {
                        if (dateEntry.date === tomorrow) {
                            tomorrowStats = dateEntry;
                            break;
                        }
                    }
                }
                
                if (tomorrowStats) {
                    displayDayData(data, true, tomorrowStats);
                } else {
                    // If no data found for tomorrow, show a message
                    displayNoDataForTomorrow();
                }
            } else {
                console.error('Error loading statistics:', data.error);
                displayError();
            }
        })
        .catch(error => {
            console.error('Failed to fetch statistics:', error);
            displayError();
        });
}

function displayDayData(data, isTomorrow, specificDateEntry = null) {
    let statsData = null;
    
    if (isTomorrow && specificDateEntry) {
        // Use the specified date entry for tomorrow
        statsData = specificDateEntry.stats;
    } else if (isTomorrow) {
        // Find data for tomorrow in the data object
        const tomorrow = getNextWorkingDay().toISOString().split('T')[0];
        
        for (const dateEntry of data.data.by_date) {
            if (dateEntry.date === tomorrow) {
                statsData = dateEntry.stats;
                break;
            }
        }
    } else {
        // Use today's data
        if (data.today_data) {
            statsData = data.today_data.stats;
        } else if (data.data && data.data.by_date && data.data.by_date.length > 0) {
            // If no specific today data, use the most recent date available
            statsData = data.data.by_date[0].stats;
        }
    }
    
    // If we have data to display, update the dashboard
    if (statsData) {
        updateDashboardWithStats(statsData);
        
        // Update the GI_TIME chart with the appropriate data
        updateGiTimeChartWithStats(statsData);
        
        // Update the title to indicate which day we're showing
        if (isTomorrow) {
            const nextWorkDay = getNextWorkingDay();
            const formattedDate = `${nextWorkDay.getDate().toString().padStart(2, '0')}-${(nextWorkDay.getMonth() + 1).toString().padStart(2, '0')}-${nextWorkDay.getFullYear().toString().slice(2)}`;
            document.getElementById('day-indicator').textContent = `Showing: ${formattedDate} (Tomorrow)`;
        } else {
            document.getElementById('day-indicator').textContent = 'Showing: Today';
        }
    } else if (isTomorrow) {
        displayNoDataForTomorrow();
    } else {
        displayError();
    }
}

function updateGiTimeChartWithStats(statsData) {
    // Check if GI_TIME data exists
    if (!statsData.by_gi_time) {
        console.warn('No GI_TIME data available in the provided stats');
        return;
    }
    
    // Prepare the chart data from the provided stats
    const chartData = prepareGiTimeChartData(statsData);
    
    // If chart data preparation failed, exit
    if (!chartData) {
        console.error('Failed to prepare GI_TIME chart data');
        return;
    }
    
    // If chart already exists, destroy it
    if (giTimeChart) {
        giTimeChart.destroy();
    }
    
    // Get canvas element
    const ctx = document.getElementById('gi-time-chart').getContext('2d');
    
    // Create new chart with the updated data
    giTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Deliveries',
                    data: chartData.deliveries,
                    backgroundColor: '#1919ec', // Blue
                    borderWidth: 1
                },
                {
                    label: 'Lines',
                    data: chartData.lines,
                    backgroundColor: '#e91e63', // Red
                    borderWidth: 1
                },
                {
                    label: 'Lines Not Picked',
                    data: chartData.linesNotPicked,
                    backgroundColor: '#7e57c2', // Purple
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20, // Reduced right padding
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time of Day',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        color: '#ffffff',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function prepareGiTimeChartData(statsData) {
    let giTimeData = statsData.by_gi_time;
    
    if (!giTimeData) {
        console.error('No GI_TIME data available');
        return null;
    }
    
    // Sort the GI_TIME keys to ensure chronological ordering
    const timeKeys = Object.keys(giTimeData).sort((a, b) => {
        // Handle 'Unknown' special case
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        
        // Simple string comparison for time values
        return a.localeCompare(b);
    });
    
    // Prepare data arrays
    const labels = [];
    const deliveries = [];
    const hu = [];
    const lines = [];
    const linesPicked = [];
    const linesNotPicked = [];
    
    // Extract data for each time slot
    timeKeys.forEach(timeKey => {
        // Format the label (can be customized based on your time format)
        let label = timeKey;
        if (timeKey !== 'Unknown') {
            // Try to format the time more nicely if possible
            try {
                // Assuming timeKey is in 24-hour format like "14:30:00"
                const timeParts = timeKey.split(':');
                if (timeParts.length >= 2) {
                    label = `${timeParts[0]}:${timeParts[1]}`;
                }
            } catch (e) {
                // If formatting fails, keep original
                console.warn('Failed to format time:', timeKey);
            }
        }
        
        labels.push(label);
        deliveries.push(giTimeData[timeKey].deliveries || 0);
        hu.push(giTimeData[timeKey].hu || 0);
        lines.push(giTimeData[timeKey].lines || 0);
        linesPicked.push(giTimeData[timeKey].lines_picked || 0);
        linesNotPicked.push(giTimeData[timeKey].lines_not_picked || 0);
    });
    
    return {
        labels,
        deliveries,
        hu,
        lines,
        linesPicked,
        linesNotPicked
    };
}

function displayNoDataForTomorrow() {
    document.getElementById('open-deliveries').textContent = 'No Data';
    document.getElementById('open-hu').textContent = 'No Data';
    document.getElementById('open-lines').textContent = 'No Data';
    document.getElementById('open-picked-lines').textContent = 'No Data';
    document.getElementById('open-lines-not-picked').textContent = 'No Data';
    document.getElementById('lines-per-hu').textContent = 'No Data';
    document.getElementById('picked-percentage').textContent = 'No Data';
    document.getElementById('not-picked-percentage').textContent = 'No Data';
    document.getElementById('total-quantity').textContent = 'No Data';
    
    // Also clear the PGI data if it exists
    if (document.getElementById('deliveries-pgi')) {
        document.getElementById('deliveries-pgi').textContent = 'No Data';
        document.getElementById('pgi-lines').textContent = 'No Data';
    }
    
    // Clear the GI Time chart
    if (giTimeChart) {
        giTimeChart.destroy();
        giTimeChart = null;
    }
    
    // Also update status boxes
    document.getElementById('status-a-deliveries').textContent = 'No Data';
    document.getElementById('status-a-hu').textContent = 'No Data';
    
    document.getElementById('status-b-deliveries').textContent = 'No Data';
    document.getElementById('status-b-hu').textContent = 'No Data';
    document.getElementById('status-b-lines').textContent = 'No Data';
    document.getElementById('status-b-lines-picked').textContent = 'No Data';
    document.getElementById('status-b-lines-not-picked').textContent = 'No Data';
    
    document.getElementById('status-c-deliveries').textContent = 'No Data';
    document.getElementById('status-c-hu').textContent = 'No Data';
    document.getElementById('status-c-lines').textContent = 'No Data';
    
    // Update new status boxes if they exist
    updateNewStatusBoxesNoData();
    
    // Update the title to indicate we're trying to show tomorrow
    const nextWorkDay = getNextWorkingDay();
    const formattedDate = `${nextWorkDay.getDate().toString().padStart(2, '0')}-${(nextWorkDay.getMonth() + 1).toString().padStart(2, '0')}-${nextWorkDay.getFullYear().toString().slice(2)}`;
    document.getElementById('day-indicator').textContent = `Showing: ${formattedDate} (No Data Available)`;
}

// Helper function to set active button
function setActiveChartButton(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll('.chart-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Add active class to selected button
    activeButton.classList.add('active');
}

// Global variables for charts
let giTimeChart = null;
let ltapChart = null;
let currentChartType = 'interval'; // Default chart type
let lastLtapData = null; // Store the last LTAP data received
// Add these global variables at the top of your JS file
let currentPickerPage = 0;
const pickersPerPage = 10;
let showingTomorrow = false;
let todayData = null;
let tomorrowData = null;
let cdhrChart = null;
let currentCdhrChartType = 'interval'; // Default chart type
let lastCdhrData = null; // Store the last CDHDR data received
let zuHistoryChart = null;
let currentZuChartType = 'interval'; // Default chart type
let lastZuData = null; // Store the last ZU History data received
// Variables for palletizer pagination
let currentZuPalletizerPage = 0;
let palletizersPerPage = 10;

function fetchAndUpdateData() {
    // Fetch main statistics data
    fetch('/api/statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store today's data for later use
                todayData = data;
                
                // Only update the dashboard if we're showing today's data
                if (!showingTomorrow) {
                    updateDashboard(data);
                    updateGiTimeChart(data);
                }
            } else {
                console.error('Error loading statistics:', data.error);
                displayError();
            }
        })
        .catch(error => {
            console.error('Failed to fetch statistics:', error);
            displayError();
        });
    
    // Fetch LTAP statistics data
    fetch('/api/ltap_statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                lastLtapData = data; // Store the data for later use
                updateLtapChart(data);
            } else {
                console.error('Error loading LTAP statistics:', data.error);
            }
        })
        .catch(error => {
            console.error('Failed to fetch LTAP statistics:', error);
        });
}

function displayError() {
    document.getElementById('open-deliveries').textContent = 'Error';
    document.getElementById('open-hu').textContent = 'Error';
    document.getElementById('open-lines').textContent = 'Error';
    document.getElementById('open-picked-lines').textContent = 'Error';
    document.getElementById('open-lines-not-picked').textContent = 'Error';
    document.getElementById('lines-per-hu').textContent = 'Error';
    document.getElementById('total-quantity').textContent = 'Error';
    document.getElementById('picked-percentage').textContent = 'Error';
    document.getElementById('not-picked-percentage').textContent = 'Error';

    // Process box
    document.getElementById('process-p2b-deliveries').textContent = 'Error';
    document.getElementById('process-p2b-lines').textContent = 'Error';
    document.getElementById('process-legacy-deliveries').textContent = 'Error';
    document.getElementById('process-legacy-lines').textContent = 'Error';

    // NESTING/CONSOLIDATION box
    document.getElementById('nesting-deliveries').textContent = 'Error';
    document.getElementById('nesting-hu').textContent = 'Error';
    document.getElementById('nesting-lines').textContent = 'Error';
    document.getElementById('nesting-lines-not-picked').textContent = 'Error';
    document.getElementById('cons-deliveries').textContent = 'Error';
    document.getElementById('cons-hu').textContent = 'Error';
    document.getElementById('cons-lines').textContent = 'Error';
    document.getElementById('cons-lines-not-picked').textContent = 'Error';

    // VAS/DG box
    document.getElementById('vas-deliveries').textContent = 'Error';
    document.getElementById('vas-hu').textContent = 'Error';
    document.getElementById('vas-lines').textContent = 'Error';
    document.getElementById('vas-lines-not-picked').textContent = 'Error';
    document.getElementById('vas-qty').textContent = 'Error';
    document.getElementById('dg-deliveries').textContent = 'Error';
    document.getElementById('dg-hu').textContent = 'Error';
    document.getElementById('dg-lines').textContent = 'Error';
    document.getElementById('dg-lines-not-picked').textContent = 'Error';
    document.getElementById('dg-qty').textContent = 'Error';
    
    // Error handling for status boxes
    document.getElementById('status-a-deliveries').textContent = 'Error';
    document.getElementById('status-a-hu').textContent = 'Error';
    
    document.getElementById('status-b-deliveries').textContent = 'Error';
    document.getElementById('status-b-hu').textContent = 'Error';
    document.getElementById('status-b-lines').textContent = 'Error';
    document.getElementById('status-b-lines-picked').textContent = 'Error';
    document.getElementById('status-b-lines-not-picked').textContent = 'Error';
    
    document.getElementById('status-c-deliveries').textContent = 'Error';
    document.getElementById('status-c-hu').textContent = 'Error';
    document.getElementById('status-c-lines').textContent = 'Error';
}

function updateNewStatusBoxesNoData() {
    // Process box
    if (document.getElementById('process-p2b-deliveries')) {
        document.getElementById('process-p2b-deliveries').textContent = 'No Data';
        document.getElementById('process-p2b-lines').textContent = 'No Data';
        document.getElementById('process-legacy-deliveries').textContent = 'No Data';
        document.getElementById('process-legacy-lines').textContent = 'No Data';
    }
    
    // NESTING/CONSOLIDATION box
    if (document.getElementById('nesting-deliveries')) {
        document.getElementById('nesting-deliveries').textContent = 'No Data';
        document.getElementById('nesting-hu').textContent = 'No Data';
        document.getElementById('nesting-lines').textContent = 'No Data';
        document.getElementById('nesting-lines-not-picked').textContent = 'No Data';
        document.getElementById('cons-deliveries').textContent = 'No Data';
        document.getElementById('cons-hu').textContent = 'No Data';
        document.getElementById('cons-lines').textContent = 'No Data';
        document.getElementById('cons-lines-not-picked').textContent = 'No Data';
    }
    
    // VAS/DG box
    if (document.getElementById('vas-deliveries')) {
        document.getElementById('vas-deliveries').textContent = 'No Data';
        document.getElementById('vas-hu').textContent = 'No Data';
        document.getElementById('vas-lines').textContent = 'No Data';
        document.getElementById('vas-lines-not-picked').textContent = 'No Data';
        document.getElementById('vas-qty').textContent = 'No Data';
        document.getElementById('dg-deliveries').textContent = 'No Data';
        document.getElementById('dg-hu').textContent = 'No Data';
        document.getElementById('dg-lines').textContent = 'No Data';
        document.getElementById('dg-lines-not-picked').textContent = 'No Data';
        document.getElementById('dg-qty').textContent = 'No Data';
    }
}

// This function needs to be extracted from your existing updateDashboard function
function updateDashboardWithStats(statsData) {
    // Update the DOM with the provided stats data
    document.getElementById('open-deliveries').textContent = statsData.deliveries || 'N/A';
    document.getElementById('open-hu').textContent = statsData.hu || 'N/A';
    document.getElementById('open-lines').textContent = statsData.lines || 'N/A';
    document.getElementById('open-picked-lines').textContent = statsData.lines_picked || 'N/A';
    document.getElementById('open-lines-not-picked').textContent = statsData.lines_not_picked || 'N/A';
    
    // Calculate and display lines per HU
    if (statsData.lines && statsData.hu && statsData.hu > 0) {
        const linesPerHu = (statsData.lines / statsData.hu).toFixed(1);
        document.getElementById('lines-per-hu').textContent = linesPerHu + ' LINES / HU';
    } else {
        document.getElementById('lines-per-hu').textContent = 'N/A';
    }
    
    // Display total quantity
    if (statsData.qty) {
        document.getElementById('total-quantity').textContent = statsData.qty.toLocaleString() + ' QUANTITY';
    } else {
        document.getElementById('total-quantity').textContent = 'N/A';
    }
    
    // Calculate and display picked percentage
    if (statsData.lines && statsData.lines > 0 && statsData.lines_picked != null) {
        const pickedPercentage = ((statsData.lines_picked / statsData.lines) * 100).toFixed(1);
        document.getElementById('picked-percentage').textContent = pickedPercentage + '% OF LINES';
    } else {
        document.getElementById('picked-percentage').textContent = 'N/A';
    }
    
    // Calculate and display not picked percentage
    if (statsData.lines && statsData.lines > 0 && statsData.lines_not_picked != null) {
        const notPickedPercentage = ((statsData.lines_not_picked / statsData.lines) * 100).toFixed(1);
        document.getElementById('not-picked-percentage').textContent = notPickedPercentage + '% OF LINES';
    } else {
        document.getElementById('not-picked-percentage').textContent = 'N/A';
    }
    
    // Update Status A data
    if (statsData.by_status && statsData.by_status['A']) {
        const statusA = statsData.by_status['A'];
        document.getElementById('status-a-deliveries').textContent = statusA.deliveries || 'N/A';
        document.getElementById('status-a-hu').textContent = statusA.hu || 'N/A';
    } else {
        document.getElementById('status-a-deliveries').textContent = '0';
        document.getElementById('status-a-hu').textContent = '0';
    }
    
    // Update Status B data
    if (statsData.by_status && statsData.by_status['B']) {
        const statusB = statsData.by_status['B'];
        document.getElementById('status-b-deliveries').textContent = statusB.deliveries || 'N/A';
        document.getElementById('status-b-hu').textContent = statusB.hu || 'N/A';
        document.getElementById('status-b-lines').textContent = statusB.lines || 'N/A';
        document.getElementById('status-b-lines-picked').textContent = statusB.lines_picked || 'N/A';
        document.getElementById('status-b-lines-not-picked').textContent = statusB.lines_not_picked || 'N/A';
    } else {
        document.getElementById('status-b-deliveries').textContent = '0';
        document.getElementById('status-b-hu').textContent = '0';
        document.getElementById('status-b-lines').textContent = '0';
        document.getElementById('status-b-lines-picked').textContent = '0';
        document.getElementById('status-b-lines-not-picked').textContent = '0';
    }
    
    // Update Status C data
    if (statsData.by_status && statsData.by_status['C']) {
        const statusC = statsData.by_status['C'];
        document.getElementById('status-c-deliveries').textContent = statusC.deliveries || 'N/A';
        document.getElementById('status-c-hu').textContent = statusC.hu || 'N/A';
        document.getElementById('status-c-lines').textContent = statusC.lines || 'N/A';
    } else {
        document.getElementById('status-c-deliveries').textContent = '0';
        document.getElementById('status-c-hu').textContent = '0';
        document.getElementById('status-c-lines').textContent = '0';
    }
    
    // Update Process box - P2B section
    if (statsData.by_process && statsData.by_process['P2B']) {
        const p2bData = statsData.by_process['P2B'];
        document.getElementById('process-p2b-deliveries').textContent = p2bData.deliveries || '0';
        document.getElementById('process-p2b-lines').textContent = p2bData.lines || '0';
    } else {
        document.getElementById('process-p2b-deliveries').textContent = '0';
        document.getElementById('process-p2b-lines').textContent = '0';
    }
    
    // Update Process box - LEGACY section
    if (statsData.by_process && statsData.by_process['LEGACY']) {
        const legacyData = statsData.by_process['LEGACY'];
        document.getElementById('process-legacy-deliveries').textContent = legacyData.deliveries || '0';
        document.getElementById('process-legacy-lines').textContent = legacyData.lines || '0';
    } else {
        document.getElementById('process-legacy-deliveries').textContent = '0';
        document.getElementById('process-legacy-lines').textContent = '0';
    }
    
    // Update NESTING/CONSOLIDATION box - NESTING section
    if (statsData.by_nesting && statsData.by_nesting['true']) {
        const nestingData = statsData.by_nesting['true'];
        document.getElementById('nesting-deliveries').textContent = nestingData.deliveries || '0';
        document.getElementById('nesting-hu').textContent = nestingData.hu || '0';
        document.getElementById('nesting-lines').textContent = nestingData.lines || '0';
        document.getElementById('nesting-lines-not-picked').textContent = nestingData.lines_not_picked || '0';
    } else {
        document.getElementById('nesting-deliveries').textContent = '0';
        document.getElementById('nesting-hu').textContent = '0';
        document.getElementById('nesting-lines').textContent = '0';
        document.getElementById('nesting-lines-not-picked').textContent = '0';
    }
    
    // Update NESTING/CONSOLIDATION box - CONSOLIDATION section
    if (statsData.by_cons && statsData.by_cons['true']) {
        const consData = statsData.by_cons['true'];
        document.getElementById('cons-deliveries').textContent = consData.deliveries || '0';
        document.getElementById('cons-hu').textContent = consData.hu || '0';
        document.getElementById('cons-lines').textContent = consData.lines || '0';
        document.getElementById('cons-lines-not-picked').textContent = consData.lines_not_picked || '0';
    } else {
        document.getElementById('cons-deliveries').textContent = '0';
        document.getElementById('cons-hu').textContent = '0';
        document.getElementById('cons-lines').textContent = '0';
        document.getElementById('cons-lines-not-picked').textContent = '0';
    }
    
    // Update VAS/DG box - VAS section
    if (statsData.by_vas && statsData.by_vas['True']) {
        const vasData = statsData.by_vas['True'];
        document.getElementById('vas-deliveries').textContent = vasData.deliveries || '0';
        document.getElementById('vas-hu').textContent = vasData.hu || '0';
        document.getElementById('vas-lines').textContent = vasData.lines || '0';
        document.getElementById('vas-lines-not-picked').textContent = vasData.lines_not_picked || '0';
        document.getElementById('vas-qty').textContent = vasData.qty || '0';
    } else {
        document.getElementById('vas-deliveries').textContent = '0';
        document.getElementById('vas-hu').textContent = '0';
        document.getElementById('vas-lines').textContent = '0';
        document.getElementById('vas-lines-not-picked').textContent = '0';
        document.getElementById('vas-qty').textContent = '0';
    }
    
    // Update VAS/DG box - DG section
    if (statsData.by_dg_vas && statsData.by_dg_vas['True']) {
        const dgData = statsData.by_dg_vas['True'];
        document.getElementById('dg-deliveries').textContent = dgData.deliveries || '0';
        document.getElementById('dg-hu').textContent = dgData.hu || '0';
        document.getElementById('dg-lines').textContent = dgData.lines || '0';
        document.getElementById('dg-lines-not-picked').textContent = dgData.lines_not_picked || '0';
        document.getElementById('dg-qty').textContent = dgData.qty || '0';
    } else {
        document.getElementById('dg-deliveries').textContent = '0';
        document.getElementById('dg-hu').textContent = '0';
        document.getElementById('dg-lines').textContent = '0';
        document.getElementById('dg-lines-not-picked').textContent = '0';
        document.getElementById('dg-qty').textContent = '0';
    }
}

function updateDashboard(data) {
    const today = data.today;
    let statsData = null;
    
    // Look for today's data first
    if (data.today_data) {
        statsData = data.today_data.stats;
    } 
    // If no data for today, use the most recent date available
    else if (data.data && data.data.by_date && data.data.by_date.length > 0) {
        // Assuming the dates are sorted, get the first one
        statsData = data.data.by_date[0].stats;
    }
    
    // Update the DOM if we have data
    if (statsData) {
        updateDashboardWithStats(statsData);
        
        // Reset day indicator to "Today" when showing today's data
        document.getElementById('day-indicator').textContent = 'Showing: Today';
    } else {
        displayError();
    }

    if (data.last_modified) {
        // Convert the timestamp to a readable format (DD-MM-YY HH:MM:SS)
        const lastModified = new Date(data.last_modified);

        lastModified.setHours(lastModified.getHours() + 1);

        
        const day = String(lastModified.getDate()).padStart(2, '0');
        const month = String(lastModified.getMonth() + 1).padStart(2, '0');
        const year = String(lastModified.getFullYear()).slice(2); // Get last 2 digits
        const hours = String(lastModified.getHours()).padStart(2, '0');
        const minutes = String(lastModified.getMinutes()).padStart(2, '0');
        const seconds = String(lastModified.getSeconds()).padStart(2, '0');
        
        const formattedTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
        document.getElementById('last-update').textContent = `Last Update: ${formattedTime}`;
    }
}

function updateGiTimeChart(data) {
    let chartData = prepareChartData(data);
    
    if (!chartData) {
        console.error('Failed to prepare chart data');
        return;
    }
    
    // If chart already exists, destroy it
    if (giTimeChart) {
        giTimeChart.destroy();
    }
    
    // Get canvas element
    const ctx = document.getElementById('gi-time-chart').getContext('2d');
    
    // Create new chart
    giTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Deliveries',
                    data: chartData.deliveries,
                    backgroundColor: '#1919ec', // Blue
                    borderWidth: 1
                },
                {
                    label: 'Lines',
                    data: chartData.lines,
                    backgroundColor: '#e91e63', // Red
                    borderWidth: 1
                },
                {
                    label: 'Lines Not Picked',
                    data: chartData.linesNotPicked,
                    backgroundColor: '#f06292', // Pink/Light red
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20, // Reduced right padding
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time of Day',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        color: '#ffffff',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function prepareChartData(data) {
    let statsData = null;
    let giTimeData = null;
    
    // Find the latest data with by_gi_time information
    if (data.today_data && data.today_data.stats && data.today_data.stats.by_gi_time) {
        statsData = data.today_data.stats;
        giTimeData = statsData.by_gi_time;
    } else if (data.data && data.data.by_date && data.data.by_date.length > 0) {
        // Look through available dates to find one with gi_time data
        for (const dateEntry of data.data.by_date) {
            if (dateEntry.stats && dateEntry.stats.by_gi_time) {
                statsData = dateEntry.stats;
                giTimeData = statsData.by_gi_time;
                break;
            }
        }
    }
    
    if (!giTimeData) {
        console.error('No GI_TIME data available');
        return null;
    }
    
    // Sort the GI_TIME keys to ensure chronological ordering
    const timeKeys = Object.keys(giTimeData).sort((a, b) => {
        // Handle 'Unknown' special case
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        
        // Simple string comparison for time values (assuming they're in comparable format)
        return a.localeCompare(b);
    });
    
    // Prepare data arrays
    const labels = [];
    const deliveries = [];
    const hu = [];
    const lines = [];
    const linesPicked = [];
    const linesNotPicked = [];
    
    // Extract data for each time slot
    timeKeys.forEach(timeKey => {
        // Format the label (can be customized based on your time format)
        let label = timeKey;
        if (timeKey !== 'Unknown') {
            // Try to format the time more nicely if possible
            try {
                // Assuming timeKey is in 24-hour format like "14:30:00"
                const timeParts = timeKey.split(':');
                if (timeParts.length >= 2) {
                    label = `${timeParts[0]}:${timeParts[1]}`;
                }
            } catch (e) {
                // If formatting fails, keep original
                console.warn('Failed to format time:', timeKey);
            }
        }
        
        labels.push(label);
        deliveries.push(giTimeData[timeKey].deliveries || 0);
        hu.push(giTimeData[timeKey].hu || 0);
        lines.push(giTimeData[timeKey].lines || 0);
        linesPicked.push(giTimeData[timeKey].lines_picked || 0);
        linesNotPicked.push(giTimeData[timeKey].lines_not_picked || 0);
    });
    
    return {
        labels,
        deliveries,
        hu,
        lines,
        linesPicked,
        linesNotPicked
    };
}

function updateLtapChart(data) {
    if (!data || !data.data) {
        console.error('Invalid LTAP data structure');
        return;
    }
    
    // Update the total picks count
    const totalPicks = data.data.total_picks || 0;
    document.getElementById('total-picks-count').textContent = totalPicks.toLocaleString();

    // If chart already exists, destroy it
    if (ltapChart) {
        ltapChart.destroy();
    }
    
    // Remove any existing peak indicators
    const existingIndicators = document.querySelectorAll('.peak-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Remove pagination controls if not viewing picker chart
    if (currentChartType !== 'picker') {
        removePaginationControls();
    }
    
    // Get canvas element
    const ctx = document.getElementById('ltap-chart').getContext('2d');
    
    // Choose the right chart based on current selection
    switch(currentChartType) {
        case 'interval':
            createIntervalChart(ctx, data.data);
            break;
        case 'hourly':
            createHourlyChart(ctx, data.data);
            break;
        case 'picker':
            createPickerChart(ctx, data.data);
            break;
        default:
            createIntervalChart(ctx, data.data);
    }
}

function createIntervalChart(ctx, ltapData) {
    // Extract data from intervals
    const timeLabels = [];
    const pickCounts = [];
    
    // Get the intervals data
    ltapData.intervals.forEach(interval => {
        // Format time labels (just show the end time)
        const endTime = interval.interval_end.split(':').slice(0, 2).join(':');
        timeLabels.push(endTime);
        pickCounts.push(interval.total_picks);
    });
    
    // Find peak value and its index
    const peakValue = Math.max(...pickCounts);
    const peakIndex = pickCounts.indexOf(peakValue);
    
    // Create chart
    ltapChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Picks per Interval',
                    data: pickCounts,
                    backgroundColor: 'rgba(25, 25, 236, 0.2)',
                    borderColor: '#1919ec',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#1919ec'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30, // Extra padding for peak indicator
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff',
                        // Show only labels for times ending in :00 or :30
                        callback: function(value, index, values) {
                            const label = timeLabels[index];
                            if (!label) return '';
                            
                            const parts = label.split(':');
                            if (parts.length === 2) {
                                const minutes = parts[1];
                                // Only show labels for times ending in :00 or :30
                                if (minutes === '00' || minutes === '30') {
                                    return label;
                                }
                            }
                            return '';  // Return empty string for labels we want to hide
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Picks',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Picks: ${context.raw}`;
                        }
                    }
                }
            },
            animation: {
                onComplete: function() {
                    // After animation is complete, add peak indicator
                    if (peakValue > 0) {
                        try {
                            const chart = this.chart;
                            const dataset = chart.data.datasets[0];
                            const meta = chart.getDatasetMeta(0);
                            
                            // Check if meta.data exists and has the necessary point
                            if (meta && meta.data && meta.data[peakIndex]) {
                                const point = meta.data[peakIndex];
                                const rect = chart.canvas.getBoundingClientRect();
                                
                                // Get position of the peak point
                                const x = point.x;
                                const y = point.y;
                                
                                // Create indicator element
                                const indicator = document.createElement('div');
                                indicator.className = 'peak-indicator';
                                indicator.textContent = `Peak: ${peakValue} picks`;
                                indicator.style.left = `${rect.left + x}px`;
                                indicator.style.top = `${rect.top + y - 40}px`;
                                indicator.style.transform = 'translateX(-50%)';
                                
                                // Add to DOM
                                document.body.appendChild(indicator);
                            }
                        } catch (e) {
                            console.warn('Could not add peak indicator', e);
                        }
                    }
                }
            }
        }
    });
}

function createHourlyChart(ctx, ltapData) {
    // Group data by hour
    const hourlyData = {};
    
    // Process intervals and group by hour
    ltapData.intervals.forEach(interval => {
        const hour = interval.interval_end.split(':')[0];
        const hourKey = `${hour}:00`;
        
        if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = 0;
        }
        
        hourlyData[hourKey] += interval.total_picks;
    });
    
    // Convert to arrays for chart
    const hourLabels = Object.keys(hourlyData).sort();
    const hourlyPicks = hourLabels.map(hour => hourlyData[hour]);
    
    // Create chart
    ltapChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [
                {
                    label: 'Picks per Hour',
                    data: hourlyPicks,
                    backgroundColor: '#1919ec',
                    borderColor: '#0000aa',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Picks',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Picks: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}


function createPickerChart(ctx, ltapData) {
    // Make sure picker_totals exists and is not empty
    if (!ltapData.picker_totals || ltapData.picker_totals.length === 0) {
        console.error('No picker data available');
        return;
    }
    
    // Sort pickers by total picks (descending)
    const sortedPickers = [...ltapData.picker_totals].sort((a, b) => b.total_picks - a.total_picks);
    
    // Get total number of pages
    const totalPages = Math.ceil(sortedPickers.length / pickersPerPage);
    
    // Ensure current page is valid
    if (currentPickerPage >= totalPages) {
        currentPickerPage = 0;
    }
    
    // Get pickers for current page
    const startIndex = currentPickerPage * pickersPerPage;
    const endIndex = Math.min(startIndex + pickersPerPage, sortedPickers.length);
    const currentPagePickers = sortedPickers.slice(startIndex, endIndex);
    
    // Extract data
    const pickerLabels = currentPagePickers.map(p => p.picker);
    const pickerPicks = currentPagePickers.map(p => p.total_picks);
    
    // Create chart
    ltapChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: pickerLabels,
            datasets: [
                {
                    label: 'Picks per Picker',
                    data: pickerPicks,
                    backgroundColor: '#4949f2',
                    borderColor: '#1919ec',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of Picks',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Picker',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    enabled: false // Disable tooltips
                }
            }
        }
    });
    
    // After chart is rendered, add pagination controls if needed
    if (totalPages > 1) {
        // Remove existing pagination controls
        const existingPagination = document.getElementById('picker-pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        // Create pagination container
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'picker-pagination';
        paginationContainer.className = 'pagination-container';
        
        // Add prev button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.innerHTML = '&laquo; Prev';
        prevButton.disabled = currentPickerPage === 0;
        prevButton.addEventListener('click', function() {
            if (currentPickerPage > 0) {
                currentPickerPage--;
                updateLtapChart(lastLtapData);
            }
        });
        
        // Add page indicator
        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'page-indicator';
        pageIndicator.textContent = `Page ${currentPickerPage + 1} of ${totalPages}`;
        
        // Add next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.innerHTML = 'Next &raquo;';
        nextButton.disabled = currentPickerPage === totalPages - 1;
        nextButton.addEventListener('click', function() {
            if (currentPickerPage < totalPages - 1) {
                currentPickerPage++;
                updateLtapChart(lastLtapData);
            }
        });
        
        // Assemble pagination controls
        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageIndicator);
        paginationContainer.appendChild(nextButton);
        
        // Add to DOM - place right below the chart
        const chartContainer = document.querySelector('.ltap-chart-container .chart-container');
        chartContainer.appendChild(paginationContainer);
    }
}