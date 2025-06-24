// Integrated Widget Grid System
document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const GRID_COLUMNS = 12;
    const GRID_ROWS = 10;
    const CELL_SIZE = 80; // in pixels
    const GRID_GAP = 10; // in pixels
    
    // GridStack instance
    let widgetGrid = null;
    
    // Track widget charts
    const widgetCharts = {};
    
    // Track removed widgets
    const removedWidgetIds = [];
    
    // Track hidden widgets
    const hiddenWidgetIds = [];
    
    // Initialize the widget grid system
    function initWidgetGrid() {
        // Get the active view
        const isPersonalizeActive = ACTIVE_VIEW === 'personalize';
        const dashboardView = document.getElementById('dashboard-view');
        const personalizeView = document.getElementById('personalize-view');
        const activeView = isPersonalizeActive ? personalizeView : dashboardView;
        const gridContainer = isPersonalizeActive ? 'personalize-grid' : 'dashboard-grid';
        
        // Ensure the grid container exists
        const gridElement = document.getElementById(gridContainer);
        if (!gridElement) {
            console.error(`Grid container #${gridContainer} not found!`);
            return;
        }
        
        console.log(`Initializing grid in ${isPersonalizeActive ? 'personalize' : 'dashboard'} view`);
        
        // GridStack options
        const gridOptions = {
            column: GRID_COLUMNS,
            cellHeight: CELL_SIZE,
            margin: GRID_GAP,
            disableOneColumnMode: false,
            float: false,
            animate: true
        };
        
        // Additional options based on view
        if (isPersonalizeActive) {
            gridOptions.staticGrid = false; // Make it editable
            gridOptions.acceptWidgets = true; // Allow new widgets to be dropped
            gridOptions.dragIn = '.widget-type-item'; // Class for items that can be dragged in
            gridOptions.dragInOptions = { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' };
        } else {
            gridOptions.staticGrid = true; // Make it non-editable in dashboard view
        }
        
        try {
            // Initialize GridStack
            widgetGrid = GridStack.init(gridOptions, `#${gridContainer}`);
            
            // Add event listeners for personalize view
            if (isPersonalizeActive) {
                // Listen for changes to save
                widgetGrid.on('change', function(event, items) {
                    console.log('Grid changed:', items);
                    // Update widget positions in memory
                    updateWidgetPositions(items);
                });
                
                // Add save button event listener
                const saveBtn = document.querySelector('.save-changes-btn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', saveWidgetConfiguration);
                }
                
                // Add widget button event listener
                const addWidgetBtn = document.querySelector('.add-widget-btn');
                if (addWidgetBtn) {
                    addWidgetBtn.addEventListener('click', openWidgetSelectionModal);
                }
                
                // Initialize widget selection modal
                initWidgetSelectionModal();
            }
            
            // Fetch widgets from the database
            fetchWidgets();
        } catch (error) {
            console.error('Error initializing grid:', error);
            showNotification('Er is een fout opgetreden bij het initialiseren van het dashboard. Probeer de pagina te verversen.', 'error');
        }
    }
    
    // Fetch widgets from the PHP API
    async function fetchWidgets() {
        try {
            // Use the PHP API endpoint with user ID
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            console.log(`Fetching widgets for user ${userId} in ${ACTIVE_VIEW} view`);
            
            const response = await fetch(`api/widgets.php?user_id=${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const widgets = await response.json();
            
            // Check if widgets is an array
            if (!Array.isArray(widgets)) {
                console.error('Expected widgets to be an array but got:', widgets);
                throw new Error('Invalid response format');
            }
            
            console.log(`Loaded ${widgets.length} widgets`);
            
            // If no widgets are found, create default widgets
            if (widgets.length === 0) {
                console.log('No widgets found, creating default widgets');
                const defaultWidgets = createDefaultWidgets();
                loadWidgetsToGrid(defaultWidgets);
            } else {
                // Load widgets into the grid
                loadWidgetsToGrid(widgets);
            }
        } catch (error) {
            console.error('Error fetching widgets:', error);
            
            // Show error notification
            showNotification('Er is een fout opgetreden bij het laden van de widgets. Probeer later opnieuw.', 'error');
            
            // Load default widgets instead of an empty grid
            const defaultWidgets = createDefaultWidgets();
            loadWidgetsToGrid(defaultWidgets);
        }
    }
    
    // Create default widgets when database fails
    function createDefaultWidgets() {
        return [
            {
                title: "Zonne-energie Productie",
                icon: "fa-sun",
                icon_color: "green",
                widget_type: "stat-card",
                column_span: 1,
                row_span: 1,
                grid_position_x: 0,
                grid_position_y: 0,
                user_widget_id: "default-1",
                widget_data: {
                    value: "24.8 kWh",
                    secondary_value: "+12% vs gisteren",
                    is_positive: true
                }
            },
            {
                title: "Stroomverbruik",
                icon: "fa-bolt",
                icon_color: "red",
                widget_type: "stat-card",
                column_span: 1,
                row_span: 1,
                grid_position_x: 1,
                grid_position_y: 0,
                user_widget_id: "default-2",
                widget_data: {
                    value: "18.2 kWh",
                    secondary_value: "-15% vs gisteren",
                    is_positive: false
                }
            },
            {
                title: "Batterij Status",
                icon: "fa-battery-three-quarters",
                icon_color: "blue",
                widget_type: "stat-card",
                column_span: 1,
                row_span: 1,
                grid_position_x: 2,
                grid_position_y: 0,
                user_widget_id: "default-3",
                widget_data: {
                    value: "78%",
                    secondary_value: "6.2 kWh opgeslagen",
                    is_positive: null
                }
            },
            {
                title: "Energie Productie",
                widget_type: "chart",
                column_span: 2,
                row_span: 1,
                grid_position_x: 0,
                grid_position_y: 1,
                user_widget_id: "default-4",
                widget_data: {
                    chart_type: "line",
                    time_period: "day"
                }
            }
        ];
    }
    
    // Load widgets into the grid
    function loadWidgetsToGrid(widgets) {
        // Clear existing widgets
        widgetGrid.removeAll();
        
        // Add widgets
        widgets.forEach(widget => {
            const widgetNode = createWidgetGridItem(widget);
            widgetGrid.addWidget(widgetNode);
            
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
        if (ACTIVE_VIEW === 'personalize') {
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
        }
        
        // Add header to widget content
        widgetContent.appendChild(widgetHeader);
        
        // Add widget body based on type
        const widgetBody = document.createElement('div');
        widgetBody.className = 'widget-body';
        
        // Add content based on widget type
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
            case 'weather':
                widgetBody.innerHTML = createWeatherContent(widget);
                break;
            case 'devices':
                widgetBody.innerHTML = createDevicesContent(widget);
                break;
            default:
                widgetBody.innerHTML = '<p>Widget content</p>';
        }
        
        widgetContent.appendChild(widgetBody);
        widgetNode.appendChild(widgetContent);
        
        return widgetNode;
    }
    
    // Create content for stat card widgets
    function createStatCardContent(widget) {
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        
        return `
            <div class="stat-card">
                <div class="stat-value">${data.value}</div>
                <div class="stat-secondary ${data.is_positive === true ? 'positive' : data.is_positive === false ? 'negative' : ''}">
                    ${data.secondary_value}
                </div>
            </div>
        `;
    }
    
    // Create content for chart widgets
    function createChartContent(widget) {
        return `<div class="chart-container"><canvas id="chart-${widget.user_widget_id}"></canvas></div>`;
    }
    
    // Create content for notifications widgets
    function createNotificationsContent(widget) {
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        let notificationsHtml = '';
        
        if (data && data.notifications) {
            data.notifications.forEach(notification => {
                notificationsHtml += `
                    <div class="notification-item ${notification.type}">
                        <i class="fas ${notification.icon}"></i>
                        <div class="notification-content">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-desc">${notification.description}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        return `<div class="notifications-list">${notificationsHtml}</div>`;
    }
    
    // Create content for weather widgets
    function createWeatherContent(widget) {
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        let forecastHtml = '';
        
        if (data && data.forecast) {
            data.forecast.forEach(item => {
                forecastHtml += `
                    <div class="forecast-item ${item.highlight ? 'highlight' : ''}">
                        <div class="forecast-label">${item.label}</div>
                        <div class="forecast-value">${item.value}</div>
                    </div>
                `;
            });
        }
        
        return `
            <div class="weather-widget">
                <div class="weather-header">
                    <div class="weather-icon"><i class="fas ${data.icon}"></i></div>
                    <div class="weather-info">
                        <div class="weather-temp">${data.temperature}</div>
                        <div class="weather-day">${data.day}</div>
                    </div>
                </div>
                <div class="weather-forecast">${forecastHtml}</div>
            </div>
        `;
    }
    
    // Create content for devices widgets
    function createDevicesContent(widget) {
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        let devicesHtml = '';
        
        if (data && data.devices) {
            data.devices.forEach(device => {
                devicesHtml += `
                    <div class="device-item">
                        <div class="device-icon" style="color: ${device.color}">
                            <i class="fas ${device.icon}"></i>
                        </div>
                        <div class="device-info">
                            <div class="device-name">${device.name}</div>
                            <div class="device-status ${device.status_class}">${device.status}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        return `<div class="devices-list">${devicesHtml}</div>`;
    }
    
    // Initialize chart widget
    function initializeChart(widget) {
        const chartId = `chart-${widget.user_widget_id}`;
        const chartCanvas = document.getElementById(chartId);
        
        if (!chartCanvas) return;
        
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        const chartType = data.chart_type || 'line';
        
        // Remove existing chart if it exists
        if (widgetCharts[chartId]) {
            widgetCharts[chartId].destroy();
        }
        
        // Sample data - in a real app this would come from an API
        let chartData, chartOptions;
        
        if (chartType === 'line') {
            // Sample line chart data for energy production
            chartData = {
                labels: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                datasets: [{
                    label: 'kWh',
                    data: [0.5, 1.8, 3.2, 4.5, 4.2, 3.0, 1.5, 0.2],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };
            
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#666' }
                    },
                    x: {
                        ticks: { color: '#666' }
                    }
                }
            };
        } else if (chartType === 'bar') {
            // Sample bar chart data for consumption vs production
            chartData = {
                labels: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                datasets: [
                    {
                        label: 'Productie',
                        data: [0.5, 1.8, 3.2, 4.5, 4.2, 3.0, 1.5, 0.2],
                        backgroundColor: 'rgba(76, 175, 80, 0.7)'
                    },
                    {
                        label: 'Verbruik',
                        data: [2.1, 1.5, 1.2, 1.5, 1.8, 2.2, 3.0, 3.5],
                        backgroundColor: 'rgba(233, 30, 99, 0.7)'
                    }
                ]
            };
            
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#666' }
                    },
                    x: {
                        ticks: { color: '#666' }
                    }
                }
            };
        }
        
        // Create new chart
        widgetCharts[chartId] = new Chart(chartCanvas, {
            type: chartType,
            data: chartData,
            options: chartOptions
        });
    }
    
    // Hide a widget
    function hideWidget(userWidgetId) {
        if (!userWidgetId) return;
        
        // Find the widget in the grid
        const widgetEl = document.querySelector(`[data-user-widget-id="${userWidgetId}"]`);
        if (widgetEl) {
            // Remove from grid
            widgetGrid.removeWidget(widgetEl);
            
            // Add to hidden widgets array
            hiddenWidgetIds.push(userWidgetId);
            
            // Show notification
            showNotification('Widget hidden. You can add it back from the "Add Widget" menu.');
        }
    }
    
    // Store of pending widget position changes
    const pendingChanges = {};
    
    // Update widget positions after grid changes
    function updateWidgetPositions(items) {
        // Process updated items if available
        if (items && items.length) {
            items.forEach(item => {
                const userWidgetId = item.el.getAttribute('data-user-widget-id');
                if (userWidgetId) {
                    // Update widget position data
                    const widgetData = {
                        user_widget_id: userWidgetId,
                        grid_position_x: item.x,
                        grid_position_y: item.y,
                        column_span: item.w,
                        row_span: item.h
                    };
                    
                    // Store the changes in the pendingChanges object to be saved later
                    pendingChanges[userWidgetId] = widgetData;
                    
                    // Update the element's attributes to reflect new position
                    item.el.setAttribute('gs-x', item.x);
                    item.el.setAttribute('gs-y', item.y);
                    item.el.setAttribute('gs-w', item.w);
                    item.el.setAttribute('gs-h', item.h);
                    
                    console.log('Updated widget position:', widgetData);
                }
            });
        }
    }
    
    // Save widget configuration to the server
    async function saveWidgetConfiguration() {
        try {
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            
            // Get all visible widgets from the grid
            const nodes = widgetGrid.getGridItems();
            const widgets = [];
            
            // Process each widget
            nodes.forEach(node => {
                const userWidgetId = node.getAttribute('data-user-widget-id');
                const widgetId = node.getAttribute('data-widget-id');
                const widgetType = node.getAttribute('data-widget-type');
                
                if (userWidgetId) {
                    // Extract grid position data from the node attributes
                    let widget = {
                        user_widget_id: userWidgetId.startsWith('default-') ? 0 : parseInt(userWidgetId),
                        widget_id: widgetId ? parseInt(widgetId) : 0,
                        title: node.querySelector('.widget-title').textContent.trim(),
                        column_span: parseInt(node.getAttribute('gs-w')),
                        row_span: parseInt(node.getAttribute('gs-h')),
                        grid_position_x: parseInt(node.getAttribute('gs-x')),
                        grid_position_y: parseInt(node.getAttribute('gs-y')),
                        is_visible: true,
                        widget_data: {} // Would extract actual widget data in a real implementation
                    };
                    
                    // Check if there are pending changes for this widget
                    if (pendingChanges[userWidgetId]) {
                        const changes = pendingChanges[userWidgetId];
                        console.log(`Applying pending changes for widget ${userWidgetId}:`, changes);
                        
                        // Update widget with pending changes
                        widget.grid_position_x = changes.grid_position_x;
                        widget.grid_position_y = changes.grid_position_y;
                        widget.column_span = changes.column_span;
                        widget.row_span = changes.row_span;
                    }
                    
                    // Skip default widgets that don't have a real widget_id
                    if (userWidgetId.startsWith('default-') && !widgetId) {
                        console.log(`Skipping default widget ${userWidgetId} without a real widget_id`);
                        return;
                    }
                    
                    widgets.push(widget);
                }
            });
            
            // Log what we're about to save
            console.log('Saving widgets:', widgets);
            
            // Prepare data to send to the server
            const data = {
                user_id: userId,
                widgets: widgets,
                removed_widget_ids: removedWidgetIds,
                hidden_widget_ids: hiddenWidgetIds
            };
            
            // Send to the server
            const response = await fetch('api/save_widget.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Save result:', result);
            
            // Clear arrays and pending changes after successful save
            removedWidgetIds.length = 0;
            hiddenWidgetIds.length = 0;
            Object.keys(pendingChanges).forEach(key => delete pendingChanges[key]);
            
            // Show success notification
            showNotification('Dashboard configuration saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving widget configuration:', error);
            showNotification('Error saving dashboard configuration. Please try again.', 'error');
        }
    }
    
    // Show a notification message
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
    
    // Initialize widget selection modal
    function initWidgetSelectionModal() {
        const modal = document.getElementById('widget-selection-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const addWidgetBtn = document.querySelector('.add-widget-btn');
        
        // Close modal when clicking the close button
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside the modal
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Load widget types when opening the modal
        loadWidgetTypes();
    }
    
    // Open widget selection modal
    function openWidgetSelectionModal() {
        const modal = document.getElementById('widget-selection-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    // Load widget types into the selection modal
    async function loadWidgetTypes() {
        try {
            const widgetTypesContainer = document.querySelector('.widget-types');
            if (!widgetTypesContainer) return;
            
            // Load widget types from API
            const widgetTypes = await fetchWidgetTypes();
            const hiddenWidgetsResponse = await fetch(`api/hidden_widgets.php?user_id=${USER_ID}`);
            
            if (!hiddenWidgetsResponse.ok) {
                throw new Error(`HTTP error! Status: ${hiddenWidgetsResponse.status}`);
            }
            
            const hiddenWidgets = await hiddenWidgetsResponse.json();
            
            // Clear container
            widgetTypesContainer.innerHTML = '';
            
            // Add widget types
            widgetTypes.forEach(type => {
                const widgetTypeItem = document.createElement('div');
                widgetTypeItem.className = 'widget-type-item';
                widgetTypeItem.setAttribute('data-widget-id', type.widget_id);
                
                widgetTypeItem.innerHTML = `
                    <div class="widget-type-icon">
                        <i class="fas ${type.default_icon || 'fa-th-large'}"></i>
                    </div>
                    <div class="widget-type-info">
                        <h4>${type.widget_name}</h4>
                        <p>${type.description}</p>
                    </div>
                `;
                
                widgetTypeItem.addEventListener('click', () => addNewWidget(type.widget_id));
                widgetTypesContainer.appendChild(widgetTypeItem);
            });
            
            // Add hidden widgets section if there are any
            if (hiddenWidgets.length > 0) {
                const hiddenSection = document.createElement('div');
                hiddenSection.className = 'hidden-widgets-section';
                hiddenSection.innerHTML = '<h3>Hidden Widgets</h3>';
                
                const hiddenList = document.createElement('div');
                hiddenList.className = 'hidden-widgets-list';
                
                hiddenWidgets.forEach(widget => {
                    const hiddenItem = document.createElement('div');
                    hiddenItem.className = 'hidden-widget-item';
                    
                    hiddenItem.innerHTML = `
                        <div class="widget-type-icon">
                            <i class="fas ${widget.icon || 'fa-th-large'}"></i>
                        </div>
                        <div class="widget-type-info">
                            <h4>${widget.title}</h4>
                        </div>
                        <button class="restore-btn" data-user-widget-id="${widget.user_widget_id}">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                    `;
                    
                    hiddenList.appendChild(hiddenItem);
                });
                
                hiddenSection.appendChild(hiddenList);
                widgetTypesContainer.appendChild(hiddenSection);
                
                // Add event listeners to restore buttons
                document.querySelectorAll('.restore-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        restoreWidget(this.getAttribute('data-user-widget-id'));
                    });
                });
            }
        } catch (error) {
            console.error('Error loading widget types:', error);
        }
    }
    
    // Fetch available widget types
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
    
    // Add a new widget to the grid
    async function addNewWidget(widgetId) {
        try {
            const modal = document.getElementById('widget-selection-modal');
            
            // Get widget details
            const response = await fetch(`api/widget_details.php?widget_id=${widgetId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const widgetDetails = await response.json();
            
            // Create a new widget with default properties
            const newWidget = {
                widget_id: widgetDetails.widget_id,
                title: widgetDetails.default_title,
                icon: widgetDetails.default_icon,
                icon_color: widgetDetails.default_icon_color,
                widget_type: widgetDetails.widget_type,
                column_span: widgetDetails.default_column_span,
                row_span: widgetDetails.default_row_span,
                grid_position_x: 0, // GridStack will find a position
                grid_position_y: 0, // GridStack will find a position
                widget_data: {},
                is_visible: true
            };
            
            // Set widget data based on type
            switch (widgetDetails.widget_type) {
                case 'stat-card':
                    newWidget.widget_data = {
                        value: '0',
                        secondary_value: 'New widget',
                        is_positive: null
                    };
                    break;
                case 'chart':
                    newWidget.widget_data = {
                        chart_type: 'line',
                        time_period: 'day'
                    };
                    break;
                case 'notifications':
                    newWidget.widget_data = {
                        notifications: [
                            {
                                type: 'info',
                                icon: 'fa-info-circle',
                                title: 'New Notification Widget',
                                description: 'Configure this widget to show your notifications'
                            }
                        ]
                    };
                    break;
            }
            
            // Create the widget element
            const widgetNode = createWidgetGridItem(newWidget);
            
            // Add to grid
            widgetGrid.addWidget(widgetNode);
            
            // Initialize chart if needed
            if (newWidget.widget_type === 'chart') {
                setTimeout(() => initializeChart(newWidget), 100);
            }
            
            // Close the modal
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Show notification
            showNotification('New widget added! Save your changes to make it permanent.', 'success');
        } catch (error) {
            console.error('Error adding new widget:', error);
            showNotification('Error adding new widget. Please try again.', 'error');
        }
    }
    
    // Restore a hidden widget
    async function restoreWidget(userWidgetId) {
        try {
            const response = await fetch(`api/restore_widget.php?user_widget_id=${userWidgetId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from hidden widgets array
                const index = hiddenWidgetIds.indexOf(parseInt(userWidgetId));
                if (index !== -1) {
                    hiddenWidgetIds.splice(index, 1);
                }
                
                // Refresh widgets
                fetchWidgets();
                
                // Close the modal
                const modal = document.getElementById('widget-selection-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Show notification
                showNotification('Widget restored successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to restore widget');
            }
        } catch (error) {
            console.error('Error restoring widget:', error);
            showNotification('Error restoring widget. Please try again.', 'error');
        }
    }
    
    // Initialize everything when the DOM is loaded
    initWidgetGrid();
}); 