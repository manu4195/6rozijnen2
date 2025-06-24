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
            cellHeight: 100, // Increased from 80 to 100 for better readability
            margin: 15, // Increased from 10 to 15 for better spacing
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
            
            // Check if we have saved positions in localStorage
            let savedPositions = null;
            try {
                const positionsData = localStorage.getItem('widget_positions');
                if (positionsData) {
                    savedPositions = JSON.parse(positionsData);
                }
            } catch (error) {
                console.error('Error loading widget positions from localStorage:', error);
                // Clear potentially corrupted localStorage data
                localStorage.removeItem('widget_positions');
            }
            
            // If we have widgets but no saved layout, apply default layout
            if (widgets.length > 0 && !savedPositions) {
                console.log('No saved layout found, applying standard layout');
                const defaultWidgets = createDefaultWidgets();
                
                // Match existing widgets with default layout positions
                widgets.forEach(widget => {
                    const defaultWidget = defaultWidgets.find(dw => dw.user_widget_id === widget.user_widget_id);
                    if (defaultWidget) {
                        widget.grid_position_x = defaultWidget.grid_position_x;
                        widget.grid_position_y = defaultWidget.grid_position_y;
                        widget.column_span = defaultWidget.column_span;
                        widget.row_span = defaultWidget.row_span;
                    }
                });
                
                // Save this layout to localStorage
                const layoutToSave = widgets.map(widget => ({
                    user_widget_id: widget.user_widget_id,
                    column_span: widget.column_span,
                    row_span: widget.row_span,
                    grid_position_x: widget.grid_position_x,
                    grid_position_y: widget.grid_position_y,
                    is_visible: true
                }));
                
                localStorage.setItem('widget_positions', JSON.stringify(layoutToSave));
                console.log('Standard layout saved to localStorage');
                
                // Load these widgets to grid
                loadWidgetsToGrid(widgets);
            } 
            // If no widgets are found, create default widgets
            else if (widgets.length === 0) {
                console.log('No widgets found, creating default widgets');
                const defaultWidgets = createDefaultWidgets();
                loadWidgetsToGrid(defaultWidgets);
            } 
            // Otherwise, load the widgets we got
            else {
                // Apply saved positions if available
                if (savedPositions) {
                    widgets.forEach(widget => {
                        const savedWidget = savedPositions.find(w => 
                            w.user_widget_id === parseInt(widget.user_widget_id) && w.is_visible === true);
                        if (savedWidget) {
                            widget.grid_position_x = savedWidget.grid_position_x;
                            widget.grid_position_y = savedWidget.grid_position_y;
                            widget.column_span = savedWidget.column_span;
                            widget.row_span = savedWidget.row_span;
                        }
                    });
                    
                    // Filter out hidden widgets
                    const visibleWidgets = widgets.filter(widget => {
                        const savedWidget = savedPositions.find(w => 
                            w.user_widget_id === parseInt(widget.user_widget_id));
                        return !savedWidget || savedWidget.is_visible !== false;
                    });
                    
                    // Update hidden widgets array
                    hiddenWidgetIds = savedPositions
                        .filter(w => w.is_visible === false)
                        .map(w => w.user_widget_id.toString());
                    
                    // Load visible widgets into the grid
                    loadWidgetsToGrid(visibleWidgets);
                } else {
                    // Load all widgets into the grid
                    loadWidgetsToGrid(widgets);
                }
            }
        } catch (error) {
            console.error('Error fetching widgets:', error);
            
            // Try to clear localStorage to start fresh
            try {
                localStorage.removeItem('widget_positions');
            } catch (e) {
                console.error('Error clearing localStorage:', e);
            }
            
            // Load default widgets instead of an empty grid
            const defaultWidgets = createDefaultWidgets();
            loadWidgetsToGrid(defaultWidgets);
        }
    }
    
    // Create default widgets when database fails
    function createDefaultWidgets() {
        return [
            // Row 1: Statistics widgets
            {
                title: "Zonne-energie Productie",
                icon: "fa-sun",
                icon_color: "#4CAF50",
                widget_type: "stat-card",
                column_span: 4, // Increased from 2 to 4
                row_span: 2,     // Increased from 1 to 2
                grid_position_x: 0,
                grid_position_y: 0,
                user_widget_id: "1",
                widget_data: {
                    value: "24.8 kWh",
                    secondary_value: "+12% vs gisteren",
                    is_positive: true
                }
            },
            {
                title: "Stroomverbruik",
                icon: "fa-bolt",
                icon_color: "#E91E63",
                widget_type: "stat-card",
                column_span: 4, // Increased from 2 to 4
                row_span: 2,     // Increased from 1 to 2
                grid_position_x: 4,
                grid_position_y: 0,
                user_widget_id: "2",
                widget_data: {
                    value: "18.2 kWh",
                    secondary_value: "-15% vs gisteren",
                    is_positive: false
                }
            },
            {
                title: "Batterij Status",
                icon: "fa-battery-three-quarters",
                icon_color: "#2196F3",
                widget_type: "stat-card",
                column_span: 4, // Increased from 2 to 4
                row_span: 2,     // Increased from 1 to 2
                grid_position_x: 8,
                grid_position_y: 0,
                user_widget_id: "3",
                widget_data: {
                    value: "78%",
                    secondary_value: "6.2 kWh opgeslagen",
                    is_positive: null
                }
            },
            
            // Row 2-3: Charts for energy data
            {
                title: "Energie Productie",
                icon: "fa-chart-line",
                icon_color: "#4CAF50",
                widget_type: "chart",
                column_span: 6, // Increased from 3 to 6
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 0,
                grid_position_y: 2,
                user_widget_id: "4",
                widget_data: {
                    chart_type: "line",
                    data_source: "solar_production"
                }
            },
            {
                title: "Energieverbruik",
                icon: "fa-chart-line", 
                icon_color: "#E91E63",
                widget_type: "chart",
                column_span: 6, // Increased from 3 to 6
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 6,
                grid_position_y: 2,
                user_widget_id: "5",
                widget_data: {
                    chart_type: "line",
                    data_source: "consumption"
                }
            },
            
            // Row 4-5: Additional charts
            {
                title: "Opslagstatus",
                icon: "fa-chart-bar",
                icon_color: "#2196F3", 
                widget_type: "chart",
                column_span: 4, // Increased from 3 to 4
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 0,
                grid_position_y: 5,
                user_widget_id: "6",
                widget_data: {
                    chart_type: "bar",
                    data_source: "storage_levels"
                }
            },
            {
                title: "Temperatuur",
                icon: "fa-temperature-high",
                icon_color: "#FF5722",
                widget_type: "chart",
                column_span: 4, // Changed size to match layout
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 4,
                grid_position_y: 5,
                user_widget_id: "7",
                widget_data: {
                    chart_type: "line",
                    data_source: "temperature"
                }
            },
            {
                title: "Waterstofproductie",
                icon: "fa-flask",
                icon_color: "#FF9800",
                widget_type: "chart",
                column_span: 4, // Changed size to match layout
                row_span: 3,     // Increased from 2 to 3
                grid_position_x: 8,
                grid_position_y: 5,
                user_widget_id: "8",
                widget_data: {
                    chart_type: "line",
                    data_source: "hydrogen_production"
                }
            }
        ];
    }
    
    // Load widgets into the grid
    function loadWidgetsToGrid(widgets) {
        // Clear existing widgets
        widgetGrid.removeAll();
        
        // Add only visible widgets
        widgets.filter(widget => widget.is_visible !== false).forEach(widget => {
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
        
        // Ensure proper sizing of the chart container
        const chartContainer = chartCanvas.closest('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '100%';
            chartContainer.style.width = '100%';
            chartContainer.style.padding = '10px';
            chartContainer.style.boxSizing = 'border-box';
        }
        
        // Parse data if needed
        const data = typeof widget.widget_data === 'string' ? JSON.parse(widget.widget_data) : widget.widget_data;
        
        // Remove existing chart if it exists
        if (widgetCharts[chartId]) {
            widgetCharts[chartId].destroy();
        }
        
        // Check if this is data with labels and values arrays (from widget_details.php)
        if (data && Array.isArray(data.labels) && Array.isArray(data.values)) {
            // Create chart with labels and values data
            widgetCharts[chartId] = new Chart(chartCanvas, {
                type: data.chart_type || 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: widget.title,
                        data: data.values,
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
                        legend: { display: false },
                        title: {
                            display: true,
                            text: widget.title,
                            font: { size: 16 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: data.unit || '',
                                font: { size: 14 }
                            },
                            ticks: { color: '#666', font: { size: 12 } }
                        },
                        x: { ticks: { color: '#666', font: { size: 12 } } }
                    }
                }
            });
            return;
        }
        
        // Check if this is CSV data (has a Tijdstip field)
        if (data && data['Tijdstip']) {
            // CSV format - create a chart from the CSV data
            
            // Choose a data column based on widget ID to show different types of data
            const widgetIdNum = parseInt(widget.user_widget_id);
            let selectedColumn = '';
            let chartTitle = '';
            let yAxisLabel = '';
            
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
            
            // Get value from the selected column
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
            // Default chart configuration
            let chartData, chartOptions;
            const chartType = data && data.chart_type ? data.chart_type : 'line';
            
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
                        legend: { 
                            position: 'top',
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
                };
            }
            
            // Create new chart
            widgetCharts[chartId] = new Chart(chartCanvas, {
                type: chartType,
                data: chartData,
                options: chartOptions
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
    
    // Hide a widget
    function hideWidget(userWidgetId) {
        if (!userWidgetId) return;
        
        try {
            // Find the widget in the grid
            const widgetEl = document.querySelector(`[data-user-widget-id="${userWidgetId}"]`);
            if (widgetEl) {
                // Remove from grid
                widgetGrid.removeWidget(widgetEl);
                
                // Add to hidden widgets array if not already there
                if (!hiddenWidgetIds.includes(userWidgetId)) {
                    hiddenWidgetIds.push(userWidgetId);
                }
                
                // Save to localStorage
                saveWidgetConfiguration();
                
                // Show notification
                showNotification('Widget verborgen. Je kunt deze weer toevoegen via het "Widget toevoegen" menu.', 'success');
            }
        } catch (error) {
            console.error('Error hiding widget:', error);
            showNotification('Fout bij het verbergen van de widget. Probeer het opnieuw.', 'error');
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
    
    // Save widget configuration to localStorage
    async function saveWidgetConfiguration() {
        try {
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
                        user_widget_id: userWidgetId.startsWith('default-') ? parseInt(userWidgetId.replace('default-', '')) : parseInt(userWidgetId),
                        column_span: parseInt(node.getAttribute('gs-w')),
                        row_span: parseInt(node.getAttribute('gs-h')),
                        grid_position_x: parseInt(node.getAttribute('gs-x')),
                        grid_position_y: parseInt(node.getAttribute('gs-y')),
                        is_visible: true
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
                    
                    widgets.push(widget);
                }
            });
            
            // Store hidden widgets as well
            const hiddenWidgetsData = hiddenWidgetIds.map(id => ({
                user_widget_id: parseInt(id),
                is_visible: false
            }));
            
            // Store all widget positions in localStorage
            localStorage.setItem('widget_positions', JSON.stringify([...widgets, ...hiddenWidgetsData]));
            
            // Clear pending changes
            Object.keys(pendingChanges).forEach(key => delete pendingChanges[key]);
            
            // Show success notification
            showNotification('Dashboard configuratie opgeslagen!', 'success');
            
            return true;
        } catch (error) {
            console.error('Error saving widget configuration:', error);
            showNotification('Fout bij het opslaan van dashboard configuratie. Probeer het opnieuw.', 'error');
            return false;
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
            
            // Get widget details from API
            const response = await fetch(`api/add_widget.php?widget_id=${widgetId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Parse the response to get the new widget data
            const newWidget = await response.json();
            
            // Create a grid item for the new widget
            const widgetNode = createWidgetGridItem(newWidget);
            
            // Add the widget to the grid
            widgetGrid.addWidget(widgetNode);
            
            // Initialize chart if it's a chart widget
            if (newWidget.widget_type === 'chart') {
                setTimeout(() => initializeChart(newWidget), 100);
            }
            
            // Save the updated configuration
            saveWidgetConfiguration();
            
            // Close the modal
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Show notification
            showNotification('Widget toegevoegd', 'success');
            
        } catch (error) {
            console.error('Error adding widget:', error);
            showNotification('Fout bij toevoegen van widget. Probeer het opnieuw.', 'error');
        }
    }
    
    // Restore a hidden widget
    async function restoreWidget(userWidgetId) {
        try {
            // Remove from hidden widgets array
            const index = hiddenWidgetIds.indexOf(userWidgetId);
            if (index !== -1) {
                hiddenWidgetIds.splice(index, 1);
            }
            
            // Update localStorage to mark the widget as visible
            const savedPositions = localStorage.getItem('widget_positions');
            if (savedPositions) {
                const positions = JSON.parse(savedPositions);
                const widgetIndex = positions.findIndex(w => w.user_widget_id.toString() === userWidgetId.toString());
                
                if (widgetIndex !== -1) {
                    positions[widgetIndex].is_visible = true;
                    localStorage.setItem('widget_positions', JSON.stringify(positions));
                }
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
        } catch (error) {
            console.error('Error restoring widget:', error);
            showNotification('Error restoring widget. Please try again.', 'error');
        }
    }
    
    // Reset dashboard to default by clearing localStorage
    function resetDashboard() {
        try {
            // Clear localStorage items related to the dashboard
            localStorage.removeItem('widget_positions');
            
            // Reset arrays
            hiddenWidgetIds.length = 0;
            Object.keys(pendingChanges).forEach(key => delete pendingChanges[key]);
            
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
    
    // Initialize everything when the DOM is loaded
    initWidgetGrid();
}); 