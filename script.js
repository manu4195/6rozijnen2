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
            cellHeight: 80,
            margin: 10,
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
        
        // Listen for changes to save
        personalizeGrid.on('change', function(event, items) {
            console.log('Grid changed:', items);
        });
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
            
            // Load widgets into the personalize grid
            loadWidgetsToGrid(widgets, personalizeGrid);
            
            // Clone to dashboard grid
            syncDashboardWithPersonalize();
            
        } catch (error) {
            console.error('Error fetching widgets:', error);
            alert('Er is een fout opgetreden bij het laden van de widgets. Probeer later opnieuw.');
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
        
        // Find the widget in the grid
        const widgetEl = document.querySelector(`[data-user-widget-id="${userWidgetId}"]`);
        if (widgetEl) {
            // Remove from grid
            personalizeGrid.removeWidget(widgetEl);
            
            // Add to hidden widgets array
            hiddenWidgetIds.push(userWidgetId);
            
            // Sync dashboard
            syncDashboardWithPersonalize();
            
            // Show notification
            showNotification('Widget hidden. You can add it back from the "Add Widget" menu.');
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
    
    // Function to save widget configuration
    async function saveWidgetConfiguration() {
        try {
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            
            // Get all widgets from personalize grid
            const nodes = personalizeGrid.getGridItems();
            const widgets = nodes.map(node => {
                const widgetId = node.getAttribute('data-widget-id');
                const userWidgetId = node.getAttribute('data-user-widget-id');
                const widgetType = node.getAttribute('data-widget-type');
                
                // Get position data
                const gridstackNode = node.gridstackNode;
                
                return {
                    user_widget_id: userWidgetId,
                    widget_id: widgetId,
                    widget_type: widgetType,
                    title: node.querySelector('.widget-title').textContent.trim(),
                    column_span: gridstackNode.w,
                    row_span: gridstackNode.h,
                    grid_position_x: gridstackNode.x,
                    grid_position_y: gridstackNode.y,
                    is_visible: true,
                    widget_data: {}  // This would need to be populated with the actual widget data
                };
            });
            
            // For all hidden widgets, set is_visible to false
            const hiddenWidgets = hiddenWidgetIds.map(id => ({
                user_widget_id: id,
                is_visible: false
            }));
            
            // Combine visible and hidden widgets
            const allWidgets = [...widgets, ...hiddenWidgets];
            
            // Send to server
            const response = await fetch('api/save_widget.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    widgets: allWidgets,
                    removed_widget_ids: removedWidgetIds
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Dashboard saved successfully!', 'success');
                
                // Clear the removed and hidden widgets arrays
                removedWidgetIds.length = 0;
                hiddenWidgetIds.length = 0;
                
                // Refresh widgets
                fetchWidgets();
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Error saving widgets:', error);
            showNotification('Error saving dashboard. Please try again.', 'error');
        }
    }
    
    // Load hidden widgets into the Add Widget modal
    async function loadHiddenWidgets() {
        try {
            // Get user ID
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            
            // Fetch hidden widgets
            const response = await fetch(`api/hidden_widgets.php?user_id=${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const hiddenWidgets = await response.json();
            
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
            // Get user ID
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            
            // Send request to restore widget
            const response = await fetch('api/restore_widget.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    user_widget_id: userWidgetId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Close modal
                const modal = document.getElementById('widget-selection-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Refresh widgets
                fetchWidgets();
                
                // Show notification
                showNotification('Widget restored successfully!', 'success');
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Error restoring widget:', error);
            showNotification('Error restoring widget. Please try again.', 'error');
        }
    }
    
    // Add a new widget from available widget types
    async function addNewWidget(widgetId) {
        try {
            // Get user ID
            const userId = typeof USER_ID !== 'undefined' ? USER_ID : 1;
            
            // Find an empty position for the new widget
            // Start with position 0,0 and check if any widget is already there
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
            
            // Create a new user widget
            const newWidgetResponse = await fetch('api/add_widget.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    widget_id: widgetId,
                    title: widgetDetails.default_title,
                    icon: widgetDetails.default_icon,
                    icon_color: widgetDetails.default_icon_color,
                    column_span: widgetDetails.default_column_span,
                    row_span: widgetDetails.default_row_span,
                    grid_position_x: gridX,
                    grid_position_y: gridY
                })
            });
            
            if (!newWidgetResponse.ok) {
                throw new Error(`HTTP error! Status: ${newWidgetResponse.status}`);
            }
            
            const result = await newWidgetResponse.json();
            
            if (result.success) {
                // Close modal
                const modal = document.getElementById('widget-selection-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Refresh widgets
                fetchWidgets();
                
                // Show notification
                showNotification('Widget added successfully!', 'success');
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
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
    
    // Initialize when DOM is loaded
    init();
});