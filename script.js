// JavaScript for tab switching, widget loading, and sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const dashboardNav = document.getElementById('dashboard-nav');
    const personalizeNav = document.getElementById('personalize-nav');
    const dashboardView = document.getElementById('dashboard-view');
    const personalizeView = document.getElementById('personalize-view');
    
    // GridStack instances
    let dashboardGrid = null;
    let personalizeGrid = null;
    
    // Track widget charts
    const widgetCharts = {};
    
    // Track removed widgets
    const removedWidgetIds = [];
    
    // Track hidden widgets
    const hiddenWidgetIds = [];
    
    // Sidebar Toggle Functionality
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Initialize GridStack
    function initGrids() {
        // Options for both grids
        const gridOptions = {
            column: 12, // 12-column grid
            cellHeight: 100, // Increased from 80 to 100 for better readability
            margin: 15, // Increased from 10 to 15 for better spacing
            disableOneColumnMode: false,
            float: false,
            animate: true
        };
        
        // Create dashboard grid (read-only)
        dashboardGrid = GridStack.init({
            ...gridOptions,
            staticGrid: true // Make it non-editable
        }, '#dashboard-grid');
        
        // Create personalize grid (editable)
        personalizeGrid = GridStack.init({
            ...gridOptions,
            staticGrid: false, // Make it editable
            acceptWidgets: true, // Allow new widgets to be dropped
            dragIn: '.widget-type-item', // Class for items that can be dragged in
            dragInOptions: { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' }
        }, '#personalize-grid');
        
        // Listen for changes to save to localStorage
        personalizeGrid.on('change', function(event, items) {
            console.log('Grid changed:', items);
            saveWidgetPositionsToLocalStorage();
        });
    }
    
    // Load widget positions from localStorage
    function loadWidgetPositionsFromLocalStorage() {
        try {
            const positionsData = localStorage.getItem('widget_positions');
            if (positionsData) {
                return JSON.parse(positionsData);
            }
            return null;
        } catch (error) {
            console.error('Error loading widget positions from localStorage:', error);
            return null;
        }
    }
    
    // Create standard widget layout for first-time visitors
    function createStandardWidgetLayout() {
        return [
            // Energy production widgets - first row
            {
                user_widget_id: 1,
                column_span: 4, // Increased from 2 to 4 for better readability
                row_span: 2,     // Increased from 1 to 2 for better readability
                grid_position_x: 0,
                grid_position_y: 0,
                is_visible: true
            },
            {
                user_widget_id: 2,
                column_span: 4, // Increased from 2 to 4
                row_span: 2,     // Increased from 1 to 2
                grid_position_x: 4,
                grid_position_y: 0,
                is_visible: true
            },
            {
                user_widget_id: 3,
                column_span: 4, // Increased from 2 to 4
                row_span: 2,     // Increased from 1 to 2
                grid_position_x: 8,
                grid_position_y: 0,
                is_visible: true
            },
            // Second row - Temperature widgets
            {
                user_widget_id: 4,
                column_span: 6, // Increased from 3 to 6
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 0,
                grid_position_y: 2,
                is_visible: true
            },
            {
                user_widget_id: 5,
                column_span: 6, // Increased from 3 to 6
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 6,
                grid_position_y: 2,
                is_visible: true
            },
            // Third row - Storage widgets
            {
                user_widget_id: 6,
                column_span: 4, // Increased from 2 to 4
                row_span: 3,     // Increased from 1 to 3
                grid_position_x: 0,
                grid_position_y: 5,
                is_visible: true
            },
            {
                user_widget_id: 7,
                column_span: 4, // Increased from 2 to 4
                row_span: 3,     // Increased from 1 to 3
                grid_position_x: 4,
                grid_position_y: 5,
                is_visible: true
            },
            {
                user_widget_id: 8,
                column_span: 4, // Increased from 3 to 4
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 8,
                grid_position_y: 5,
                is_visible: true
            }
        ];
    }
    
    // Fetch widgets from the PHP API
    async function fetchWidgets() {
        try {
            // Use the PHP API endpoint with user ID
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            const response = await fetch(`api/widgets.php?user_id=${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const widgets = await response.json();
            
            // Apply saved positions from localStorage if available
            const savedPositions = loadWidgetPositionsFromLocalStorage();
            if (savedPositions) {
                widgets.forEach(widget => {
                    const savedWidget = savedPositions.find(w => w.user_widget_id === widget.user_widget_id);
                    if (savedWidget) {
                        widget.grid_position_x = savedWidget.grid_position_x;
                        widget.grid_position_y = savedWidget.grid_position_y;
                        widget.column_span = savedWidget.column_span;
                        widget.row_span = savedWidget.row_span;
                    }
                });
            } else {
                // Apply standard layout for first-time visitors
                const standardLayout = createStandardWidgetLayout();
                widgets.forEach(widget => {
                    const layoutWidget = standardLayout.find(w => w.user_widget_id === parseInt(widget.user_widget_id));
                    if (layoutWidget) {
                        widget.grid_position_x = layoutWidget.grid_position_x;
                        widget.grid_position_y = layoutWidget.grid_position_y;
                        widget.column_span = layoutWidget.column_span;
                        widget.row_span = layoutWidget.row_span;
                    }
                });
                
                // Save the standard layout to localStorage
                saveWidgetPositionsToLocalStorage();
            }
            
            // Load widgets into the personalize grid
            loadWidgetsToGrid(widgets, personalizeGrid);
            
            // Clone to dashboard grid
            syncDashboardWithPersonalize();
            
        } catch (error) {
            console.error('Error fetching widgets:', error);
            // Continue silently without showing an error message
        }
    }
    
    // Fetch available widget types for the add widget modal
    async function fetchWidgetTypes() {
        try {
            const response = await fetch('api/widget_types.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching widget types:', error);
            return [];
        }
    }
    
    // Load widgets into a GridStack instance
    function loadWidgetsToGrid(widgets, grid) {
        // Clear existing widgets
        grid.removeAll();
        
        // Add widgets
        widgets.forEach(widget => {
            const widgetNode = createWidgetGridItem(widget);
            grid.addWidget(widgetNode);
            
            // Initialize charts if needed
            if (widget.widget_type === 'chart') {
                setTimeout(() => initializeChart(widget), 100);
            }
        });
    }
    
    // Create a widget grid item with appropriate controls
    function createWidgetGridItem(widget) {
        const widgetNode = document.createElement('div');
        widgetNode.className = 'grid-stack-item';
        widgetNode.setAttribute('gs-x', widget.grid_position_x);
        widgetNode.setAttribute('gs-y', widget.grid_position_y);
        widgetNode.setAttribute('gs-w', widget.column_span);
        widgetNode.setAttribute('gs-h', widget.row_span);
        widgetNode.setAttribute('data-widget-id', widget.widget_id || '');
        widgetNode.setAttribute('data-user-widget-id', widget.user_widget_id || '');
        widgetNode.setAttribute('data-widget-type', widget.widget_type || '');
        
        // Create widget content
        const widgetContent = document.createElement('div');
        widgetContent.className = 'grid-stack-item-content';
        
        // Create widget header
        const widgetHeader = document.createElement('div');
        widgetHeader.className = 'widget-header';
        
        // Widget title
        const titleEl = document.createElement('h3');
        titleEl.className = 'widget-title';
        titleEl.innerHTML = widget.title;
        if (widget.icon) {
            const iconEl = document.createElement('i');
            iconEl.className = `fas ${widget.icon}`;
            if (widget.icon_color) {
                iconEl.style.color = widget.icon_color;
            }
            titleEl.prepend(iconEl, ' ');
        }
        widgetHeader.appendChild(titleEl);
        
        // Widget controls (only for personalize view)
        const controls = document.createElement('div');
        controls.className = 'widget-controls';
        
        // Hide widget button
        const hideBtn = document.createElement('button');
        hideBtn.className = 'widget-control hide-widget';
        hideBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        hideBtn.title = 'Hide Widget';
        hideBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideWidget(widget.user_widget_id);
        });
        
        controls.appendChild(hideBtn);
        widgetHeader.appendChild(controls);
        
        // Add header to widget content
        widgetContent.appendChild(widgetHeader);
        
        // Add widget body based on type
        const widgetBody = document.createElement('div');
        widgetBody.className = 'widget-body';
        
        // Here we would add the specific content based on widget type
        switch (widget.widget_type) {
            case 'stat-card':
                widgetBody.innerHTML = createStatCardContent(widget);
                break;
            case 'chart':
                widgetBody.innerHTML = createChartContent(widget);
                break;
            case 'notifications':
                widgetBody.innerHTML = createNotificationsContent(widget);
                break;
            default:
                widgetBody.innerHTML = '<p>Widget content</p>';
        }
        
        widgetContent.appendChild(widgetBody);
        widgetNode.appendChild(widgetContent);
        
        return widgetNode;
    }
    
    // Hide a widget (set is_visible to false)
    function hideWidget(userWidgetId) {
        if (!userWidgetId) return;
        
        try {
            // Find the widget in the grid
            const widgetEl = document.querySelector(`[data-user-widget-id="${userWidgetId}"]`);
            if (widgetEl) {
                // Remove from grid
                personalizeGrid.removeWidget(widgetEl);
                
                // Add to hidden widgets array if not already there
                if (!hiddenWidgetIds.includes(userWidgetId)) {
                    hiddenWidgetIds.push(userWidgetId);
                }
                
                // Sync dashboard
                syncDashboardWithPersonalize();
                
                // Save to local storage immediately
                saveWidgetPositionsToLocalStorage();
                
                // Show notification
                showNotification('Widget verborgen. Je kunt deze weer toevoegen via het "Widget toevoegen" menu.', 'success');
            }
        } catch (error) {
            console.error('Error hiding widget:', error);
            showNotification('Fout bij het verbergen van de widget. Probeer het opnieuw.', 'error');
        }
    }
    
    // Show a notification message
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Remove any existing notifications first
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
    
    // Sync dashboard with personalize grid
    function syncDashboardWithPersonalize() {
        // Clear dashboard grid
        dashboardGrid.removeAll();
        
        // Get all visible widgets from personalize grid
        const nodes = personalizeGrid.getGridItems();
        
        // Add each to dashboard grid
        nodes.forEach(node => {
            const clone = node.cloneNode(true);
            // Remove controls from dashboard view
            const controls = clone.querySelector('.widget-controls');
            if (controls) controls.remove();
            dashboardGrid.addWidget(clone);
        });
    }
    
    // Save widget positions to localStorage
    function saveWidgetPositionsToLocalStorage() {
        try {
            // Get all widgets from personalize grid
            const nodes = personalizeGrid.getGridItems();
            const widgets = nodes.map(node => {
                const userWidgetId = node.getAttribute('data-user-widget-id');
                
                // Get position data
                const gridstackNode = node.gridstackNode;
                
                return {
                    user_widget_id: parseInt(userWidgetId),
                    column_span: gridstackNode.w,
                    row_span: gridstackNode.h,
                    grid_position_x: gridstackNode.x,
                    grid_position_y: gridstackNode.y,
                    is_visible: true
                };
            });
            
            // Store hidden widgets as well
            const hiddenWidgetsData = hiddenWidgetIds.map(id => ({
                user_widget_id: parseInt(id),
                is_visible: false
            }));
            
            // Store all widget positions
            localStorage.setItem('widget_positions', JSON.stringify([...widgets, ...hiddenWidgetsData]));
            
            console.log('Widget positions saved to localStorage');
            
        } catch (error) {
            console.error('Error saving widget positions to localStorage:', error);
            showNotification('Fout bij het opslaan van widget posities. Probeer het opnieuw.', 'error');
        }
    }
    
    // Create content for chart widgets
    function createChartContent(widget) {
        return `<div class="chart-container"><canvas id="chart-${widget.user_widget_id}"></canvas></div>`;
    }
    
    // Initialize chart widget
    function initializeChart(widget) {
        const chartId = `chart-${widget.user_widget_id}`;
        const chartCanvas = document.getElementById(chartId);
        
        if (!chartCanvas) return;
        
        // Ensure proper sizing of the chart container
        const chartContainer = chartCanvas.closest('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '100%';
            chartContainer.style.width = '100%';
            chartContainer.style.padding = '10px';
            chartContainer.style.boxSizing = 'border-box';
        }
        
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        
        // Remove existing chart if it exists
        if (widgetCharts[chartId]) {
            widgetCharts[chartId].destroy();
        }
        
        // Check if the data has CSV format (Tijdstip field)
        if (data && data['Tijdstip']) {
            // CSV format - use implementation for CSV data
            // Get time labels - convert from date format to hour:minute
            const timeLabels = [];
            // For just this widget, pick a relevant data column to show
            let dataValues = [];
            let chartTitle = '';
            let yAxisLabel = '';
            
            // Choose data column based on widget ID to show different data types
            const widgetIdNum = parseInt(widget.user_widget_id);
            let selectedColumn = '';
            
            switch (widgetIdNum % 8) {
                case 0:
                    selectedColumn = 'Zonnepaneelspanning (V)';
                    chartTitle = 'Zonnepaneelspanning';
                    yAxisLabel = 'Volt';
                    break;
                case 1:
                    selectedColumn = 'Zonnepaneelstroom (A)';
                    chartTitle = 'Zonnepaneelstroom';
                    yAxisLabel = 'Ampère';
                    break;
                case 2:
                    selectedColumn = 'Waterstofproductie (L/u)';
                    chartTitle = 'Waterstofproductie';
                    yAxisLabel = 'L/u';
                    break;
                case 3:
                    selectedColumn = 'Stroomverbruik woning (kW)';
                    chartTitle = 'Stroomverbruik woning';
                    yAxisLabel = 'kW';
                    break;
                case 4:
                    selectedColumn = 'Buitentemperatuur (°C)';
                    chartTitle = 'Buitentemperatuur';
                    yAxisLabel = '°C';
                    break;
                case 5:
                    selectedColumn = 'Binnentemperatuur (°C)';
                    chartTitle = 'Binnentemperatuur';
                    yAxisLabel = '°C';
                    break;
                case 6:
                    selectedColumn = 'Accuniveau (%)';
                    chartTitle = 'Accuniveau';
                    yAxisLabel = '%';
                    break;
                case 7:
                    selectedColumn = 'Waterstofopslag woning (%)';
                    chartTitle = 'Waterstofopslag';
                    yAxisLabel = '%';
                    break;
            }
            
            // Get the value and ensure it's a number
            let dataValue = 0;
            if (data[selectedColumn]) {
                // Replace comma with dot for correct numeric value
                dataValue = parseFloat(data[selectedColumn].toString().replace(',', '.'));
            }
            
            // Use time from Tijdstip column as label
            const timeLabel = data['Tijdstip'] ? data['Tijdstip'].substring(11, 16) : '00:00'; // Extract HH:MM from time
            
            // Create chart with CSV data
            widgetCharts[chartId] = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: [timeLabel],
                    datasets: [{
                        label: chartTitle,
                        data: [dataValue],
                        borderColor: widget.icon_color || '#4CAF50',
                        backgroundColor: convertHexToRGBA(widget.icon_color || '#4CAF50', 0.5),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: chartTitle,
                            font: {
                                size: 16
                            }
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: yAxisLabel,
                                font: {
                                    size: 14
                                }
                            },
                            ticks: { 
                                color: '#666',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        x: {
                            ticks: { 
                                color: '#666',
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
            
            // Update widget title
            const titleEl = document.querySelector(`[data-user-widget-id="${widget.user_widget_id}"] .widget-title`);
            if (titleEl) {
                titleEl.innerHTML = `<i class="fas ${widget.icon}" style="color: ${widget.icon_color};"></i> ${chartTitle}`;
            }
        } else {
            // Fallback for unknown format or missing data
            widgetCharts[chartId] = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                    datasets: [{
                        label: 'Sample Data',
                        data: [4.2, 3.8, 5.1, 6.7, 4.9, 3.5],
                        borderColor: widget.icon_color || '#4CAF50',
                        backgroundColor: convertHexToRGBA(widget.icon_color || '#4CAF50', 0.1),
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: false,
                            labels: {
                                font: {
                                    size: 14
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: widget.title,
                            font: {
                                size: 16
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                color: '#666',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        x: {
                            ticks: { 
                                color: '#666',
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Helper function to convert hex color to rgba with opacity
    function convertHexToRGBA(hex, opacity) {
        if (!hex) return `rgba(76, 175, 80, ${opacity})`; // Default green as fallback
        
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Function to save widget configuration
    async function saveWidgetConfiguration() {
        try {
            // Save widgets to localStorage
            saveWidgetPositionsToLocalStorage();
            
            // Show success notification
            showNotification('Dashboard configuratie succesvol opgeslagen!', 'success');
            
            // Clear the removed and hidden widgets arrays (we're keeping track of them in localStorage)
            removedWidgetIds.length = 0;
            
        } catch (error) {
            console.error('Error saving widgets:', error);
            showNotification('Fout bij het opslaan van dashboard configuratie. Probeer het opnieuw.', 'error');
        }
    }
    
    // Load hidden widgets into the Add Widget modal
    async function loadHiddenWidgets() {
        try {
            // Get hidden widgets from localStorage
            const savedPositions = loadWidgetPositionsFromLocalStorage();
            let hiddenWidgets = [];
            
            if (savedPositions) {
                // Filter out widgets with is_visible=false
                hiddenWidgets = savedPositions.filter(widget => widget.is_visible === false)
                    .map(widget => {
                        // Create dummy data for hidden widgets
                        return {
                            user_widget_id: widget.user_widget_id,
                            widget_id: widget.user_widget_id % 8 + 1, // Dummy widget ID
                            user_id: 1,
                            widget_type: 'chart',
                            title: `Hidden Widget ${widget.user_widget_id}`,
                            icon: 'fa-chart-line',
                            icon_color: '#4CAF50',
                            description: 'This widget was hidden',
                            is_visible: false
                        };
                    });
            }
            
            // Get the container for hidden widgets
            const hiddenWidgetsContainer = document.querySelector('.hidden-widgets-container');
            if (!hiddenWidgetsContainer) return;
            
            // Clear container
            hiddenWidgetsContainer.innerHTML = '';
            
            // Add a header if we have hidden widgets
            if (hiddenWidgets.length > 0) {
                const header = document.createElement('h3');
                header.textContent = 'Hidden Widgets';
                hiddenWidgetsContainer.appendChild(header);
            }
            
            // Add each hidden widget
            hiddenWidgets.forEach(widget => {
                const widgetItem = document.createElement('div');
                widgetItem.className = 'widget-type-item hidden-widget-item';
                widgetItem.setAttribute('data-user-widget-id', widget.user_widget_id);
                widgetItem.setAttribute('data-widget-id', widget.widget_id);
                widgetItem.setAttribute('data-widget-type', widget.widget_type);
                
                // Widget icon
                let iconHTML = '';
                if (widget.icon) {
                    const iconColor = widget.icon_color ? `color: ${widget.icon_color};` : '';
                    iconHTML = `<i class="fas ${widget.icon}" style="${iconColor}"></i>`;
                }
                
                // Widget content
                widgetItem.innerHTML = `
                    <div class="widget-type-icon">${iconHTML}</div>
                    <div class="widget-type-info">
                        <h4>${widget.title}</h4>
                        <p>${widget.description || ''}</p>
                    </div>
                    <button class="restore-widget-btn" title="Restore Widget">
                        <i class="fas fa-eye"></i> Restore
                    </button>
                `;
                
                // Add event listener to restore button
                const restoreBtn = widgetItem.querySelector('.restore-widget-btn');
                restoreBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    restoreWidget(widget.user_widget_id);
                });
                
                hiddenWidgetsContainer.appendChild(widgetItem);
            });
            
        } catch (error) {
            console.error('Error loading hidden widgets:', error);
        }
    }
    
    // Restore a hidden widget
    async function restoreWidget(userWidgetId) {
        try {
            // Get saved positions from localStorage
            const savedPositions = loadWidgetPositionsFromLocalStorage();
            
            if (savedPositions) {
                // Find the hidden widget
                const widgetIndex = savedPositions.findIndex(w => w.user_widget_id === userWidgetId && w.is_visible === false);
                
                if (widgetIndex >= 0) {
                    // Set widget to visible
                    savedPositions[widgetIndex].is_visible = true;
                    
                    // Save updated positions
                    localStorage.setItem('widget_positions', JSON.stringify(savedPositions));
                    
                    // Remove from hidden widgets array
                    hiddenWidgetIds = hiddenWidgetIds.filter(id => id !== userWidgetId);
                    
                    // Close modal
                    const modal = document.getElementById('widget-selection-modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                    
                    // Refresh widgets
                    fetchWidgets();
                    
                    // Show notification
                    showNotification('Widget restored successfully!', 'success');
                }
            }
            
        } catch (error) {
            console.error('Error restoring widget:', error);
            showNotification('Error restoring widget. Please try again.', 'error');
        }
    }
    
    // Add a new widget from available widget types
    async function addNewWidget(widgetId) {
        try {
            // Find an empty position for the new widget
            let gridX = 0;
            let gridY = 0;
            
            // Get all widgets
            const nodes = personalizeGrid.getGridItems();
            
            // Find max Y position
            if (nodes.length > 0) {
                let maxY = 0;
                nodes.forEach(node => {
                    const nodeY = parseInt(node.getAttribute('gs-y'));
                    const nodeH = parseInt(node.getAttribute('gs-h'));
                    const bottomY = nodeY + nodeH;
                    if (bottomY > maxY) {
                        maxY = bottomY;
                    }
                });
                gridY = maxY; // Place new widget at the bottom
            }
            
            // Fetch widget details
            const response = await fetch(`api/widget_details.php?widget_id=${widgetId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const widgetDetails = await response.json();
            
            // Generate a new user widget ID
            const newUserWidgetId = Date.now(); // Use timestamp as a unique ID
            
            // Create a dummy widget
            const newWidget = {
                user_widget_id: newUserWidgetId,
                user_id: 1,
                widget_id: widgetId,
                widget_type: 'chart',
                title: widgetDetails.default_title,
                icon: widgetDetails.default_icon,
                icon_color: widgetDetails.default_icon_color,
                column_span: widgetDetails.default_column_span,
                row_span: widgetDetails.default_row_span,
                grid_position_x: gridX,
                grid_position_y: gridY,
                is_visible: true,
                widget_data: widgetDetails.default_data || {}
            };
            
            // Create widget element
            const widgetEl = createWidgetGridItem(newWidget);
            
            // Add to grid
            personalizeGrid.addWidget(widgetEl);
            
            // Initialize chart
            if (newWidget.widget_type === 'chart') {
                setTimeout(() => initializeChart(newWidget), 100);
            }
            
            // Save to localStorage
            saveWidgetPositionsToLocalStorage();
            
            // Close modal
            const modal = document.getElementById('widget-selection-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Sync dashboard
            syncDashboardWithPersonalize();
            
            // Show notification
            showNotification('Widget added successfully!', 'success');
            
        } catch (error) {
            console.error('Error adding widget:', error);
            showNotification('Error adding widget. Please try again.', 'error');
        }
    }
    
    // Initialize the application
    function init() {
        // Initialize grids
        initGrids();
        
        // Load widgets
        fetchWidgets();
        
        // Set up Add Widget button
        const addWidgetBtn = document.querySelector('.add-widget-btn');
        const widgetModal = document.getElementById('widget-selection-modal');
        const closeModalBtn = document.querySelector('.close-modal');
        
        if (addWidgetBtn && widgetModal) {
            addWidgetBtn.addEventListener('click', function() {
                // Load widget types
                fetchWidgetTypes().then(widgetTypes => {
                    // Populate widget types in modal
                    const widgetTypesContainer = widgetModal.querySelector('.widget-types');
                    if (widgetTypesContainer) {
                        widgetTypesContainer.innerHTML = '';
                        
                        // Add header for available widgets
                        const availableHeader = document.createElement('h3');
                        availableHeader.textContent = 'Available Widgets';
                        widgetTypesContainer.appendChild(availableHeader);
                        
                        // Create container for available widgets
                        const availableWidgetsContainer = document.createElement('div');
                        availableWidgetsContainer.className = 'available-widgets-container';
                        widgetTypesContainer.appendChild(availableWidgetsContainer);
                        
                        widgetTypes.forEach(type => {
                            const typeItem = document.createElement('div');
                            typeItem.className = 'widget-type-item';
                            typeItem.setAttribute('data-widget-id', type.widget_id);
                            typeItem.setAttribute('data-widget-type', type.widget_type);
                            
                            // Widget icon
                            let iconHTML = '';
                            if (type.default_icon) {
                                const iconColor = type.default_icon_color ? `color: ${type.default_icon_color};` : '';
                                iconHTML = `<i class="fas ${type.default_icon}" style="${iconColor}"></i>`;
                            }
                            
                            // Widget content
                            typeItem.innerHTML = `
                                <div class="widget-type-icon">${iconHTML}</div>
                                <div class="widget-type-info">
                                    <h4>${type.default_title}</h4>
                                    <p>${type.description || ''}</p>
                                </div>
                                <button class="add-widget-btn-small" title="Add Widget" ${type.already_added ? 'disabled' : ''}>
                                    <i class="fas ${type.already_added ? 'fa-check' : 'fa-plus'}"></i> ${type.already_added ? 'Added' : 'Add'}
                                </button>
                            `;
                            
                            // Add event listener for adding widget
                            if (!type.already_added) {
                                const addBtn = typeItem.querySelector('.add-widget-btn-small');
                                addBtn.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addNewWidget(type.widget_id);
                                });
                            }
                            
                            availableWidgetsContainer.appendChild(typeItem);
                        });
                        
                        // Add container for hidden widgets
                        const hiddenWidgetsContainer = document.createElement('div');
                        hiddenWidgetsContainer.className = 'hidden-widgets-container';
                        widgetTypesContainer.appendChild(hiddenWidgetsContainer);
                        
                        // Load hidden widgets
                        loadHiddenWidgets();
                    }
                });
                
                // Show modal
                widgetModal.style.display = 'block';
            });
            
            // Close modal
            closeModalBtn.addEventListener('click', function() {
                widgetModal.style.display = 'none';
            });
            
            // Close modal when clicking outside
            window.addEventListener('click', function(event) {
                if (event.target == widgetModal) {
                    widgetModal.style.display = 'none';
                }
            });
        }
        
        // Set up Save Changes button
        const saveChangesBtn = document.querySelector('.save-changes-btn');
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener('click', saveWidgetConfiguration);
        }
    }
    
    // Function to reset dashboard to default by clearing localStorage
    function resetDashboard() {
        try {
            // Clear localStorage items related to the dashboard
            localStorage.removeItem('widget_positions');
            
            // Reset arrays
            hiddenWidgetIds.length = 0;
            removedWidgetIds.length = 0;
            
            // Show notification
            showNotification('Dashboard reset succesvol. De pagina wordt nu herladen.', 'success');
            
            // Reload the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
            return true;
        } catch (error) {
            console.error('Error resetting dashboard:', error);
            showNotification('Fout bij het resetten van dashboard. Probeer de pagina handmatig te herladen.', 'error');
            return false;
        }
    }
    
    // Make reset function available globally for troubleshooting
    window.resetDashboard = resetDashboard;
    
    // Initialize when DOM is loaded
    init();
});

// Settings Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get references to settings page elements
    const saveProfileBtn = document.getElementById('save-profile');
    const changePasswordBtn = document.getElementById('change-password');
    const saveNotificationsBtn = document.getElementById('save-notifications');
    const deleteAccountBtn = document.getElementById('delete-account');
    
    // Update profile information
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            
            // Validate inputs
            if (!username || !email) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Make API call to update profile
            fetch('api/update_profile.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(data.message, 'success');
                    // Update displayed username in sidebar
                    const profileName = document.querySelector('.profile-name');
                    if (profileName) {
                        profileName.textContent = username;
                    }
                } else {
                    showNotification(data.error, 'error');
                }
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                showNotification('Error updating profile. Please try again.', 'error');
            });
        });
    }
    
    // Change password
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate inputs
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('Password must be at least 6 characters long', 'error');
                return;
            }
            
            // Make API call to change password
            fetch('api/change_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(data.message, 'success');
                    // Clear the form
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                } else {
                    showNotification(data.error, 'error');
                }
            })
            .catch(error => {
                console.error('Error changing password:', error);
                showNotification('Error changing password. Please try again.', 'error');
            });
        });
    }
    
    // Save notification preferences
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', function() {
            const emailNotifications = document.getElementById('email-notifications').checked;
            const usageAlerts = document.getElementById('usage-alerts').checked;
            const tipsUpdates = document.getElementById('tips-updates').checked;
            
            // For this demo, we'll just show a success message
            // In a real app, you would make an API call here
            showNotification('Notification preferences saved', 'success');
        });
    }
    
    // Delete account
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // For this demo, we'll just redirect to logout
                // In a real app, you would make an API call here
                window.location.href = 'login/logout.php';
            }
        });
    }
    
    // Function to show notifications
    function showNotification(message, type = 'info') {
        // Check if the notification container exists
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                notification.classList.add('hiding');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
});