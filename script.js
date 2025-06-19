// JavaScript for tab switching and personalization features
document.addEventListener('DOMContentLoaded', function() {
    const dashboardNav = document.getElementById('dashboard-nav');
    const personalizeNav = document.getElementById('personalize-nav');
    const dashboardView = document.getElementById('dashboard-view');
    const personalizeView = document.getElementById('personalize-view');
    const dashboardGrid = document.getElementById('dashboard-grid');
    const personalizeGrid = document.getElementById('personalize-grid');
    
    // Sidebar Toggle Functionality - Simplified Direct Implementation
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (menuToggle && sidebar) {
        console.log('Sidebar toggle elements found'); // Debugging
        
        // Simple direct click handler
        menuToggle.addEventListener('click', function() {
            console.log('Menu toggle clicked'); // Debugging
            sidebar.classList.toggle('collapsed');
        });
    } else {
        console.error('Sidebar toggle elements not found:');
        console.error('Sidebar:', sidebar);
        console.error('Menu toggle:', menuToggle);
    }
    
    // Fetch widgets from the PHP API
    async function fetchWidgets() {
        try {
            // Updated to use the PHP API endpoint
            const response = await fetch('api/widgets.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const widgets = await response.json();
            
            // Clear personalize grid before adding widgets
            personalizeGrid.innerHTML = '';
            
            // Generate widgets from API data
            widgets.forEach(widget => {
                const widgetElement = createWidgetElement(widget);
                personalizeGrid.appendChild(widgetElement);
            });
            
            // Update dashboard with loaded widgets
            syncDashboardWithPersonalize();
            
        } catch (error) {
            console.error('Error fetching widgets:', error);
            // Handle errors - e.g., display a message or fallback to default widgets
            alert('Er is een fout opgetreden bij het laden van de widgets. Gebruik van standaard widgets.');
            
            // Use existing HTML structure if present, otherwise stay with empty grid
            console.log('Using default widgets from HTML if available');
        }
    }
    
    // Create a widget element based on widget data
    function createWidgetElement(widget) {
        const widgetElement = document.createElement('div');
        
        // Set common widget attributes
        widgetElement.className = `widget ${widget.type}`;
        widgetElement.dataset.widgetId = widget.widget_id;
        widgetElement.dataset.colSpan = widget.column_span;
        widgetElement.dataset.rowSpan = widget.row_span;
        
        // Add appropriate classes based on column and row span
        if (widget.column_span > 1) {
            widgetElement.classList.add(`span-${widget.column_span}-cols`);
        }
        if (widget.row_span > 1) {
            widgetElement.classList.add(`span-${widget.row_span}-rows`);
        }
        
        // Create widget controls
        const controlsHtml = `
            <div class="widget-controls">
                <button class="widget-control-btn remove-btn" title="Remove widget"><i class="fas fa-times"></i></button>
                <button class="widget-control-btn expand-btn" title="Expand widget"><i class="fas fa-expand-alt"></i></button>
                ${widget.column_span > 1 || widget.row_span > 1 ? 
                    '<button class="widget-control-btn shrink-btn" title="Shrink widget"><i class="fas fa-compress-alt"></i></button>' : 
                    ''}
            </div>
        `;
        
        // Generate content based on widget type
        let contentHtml = '';
        
        if (widget.type === 'stat-card') {
            contentHtml = `
                <div class="stat-header">
                    <span>${widget.title}</span>
                    <i class="fas ${widget.icon} stat-icon ${widget.icon_color}"></i>
                </div>
                <div class="stat-value">${widget.value || ''}</div>
                <div class="stat-${widget.is_positive !== null ? 'change' : 'desc'} ${widget.is_positive === true ? 'positive' : widget.is_positive === false ? 'negative' : ''}">
                    ${widget.secondary_value || ''}
                </div>
            `;
        } else if (widget.type === 'chart') {
            contentHtml = `
                <div class="panel-header">
                    <h3>${widget.title}</h3>
                    <button class="panel-menu"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                <div class="panel-content chart-container"></div>
            `;
        } else if (widget.type === 'notifications') {
            const notificationsData = widget.data_json ? JSON.parse(widget.data_json) : [];
            
            let notificationsHtml = '';
            if (notificationsData.length > 0) {
                notificationsData.forEach(notification => {
                    notificationsHtml += `
                        <div class="notification ${notification.type}">
                            <i class="fas ${notification.icon}"></i>
                            <div class="notification-content">
                                <p class="notification-title">${notification.title}</p>
                                <p class="notification-desc">${notification.description}</p>
                            </div>
                        </div>
                    `;
                });
            }
            
            contentHtml = `
                <div class="panel-header">
                    <h3>${widget.title}</h3>
                    <button class="panel-menu"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                <div class="panel-content notifications">
                    ${notificationsHtml}
                </div>
            `;
        } else if (widget.type === 'weather') {
            const weatherData = widget.data_json ? JSON.parse(widget.data_json) : {};
            
            let forecastHtml = '';
            if (weatherData.forecast && weatherData.forecast.length > 0) {
                weatherData.forecast.forEach(item => {
                    forecastHtml += `
                        <div class="forecast-item">
                            <p>${item.label}</p>
                            <p class="forecast-value ${item.highlight ? 'highlight' : ''}">${item.value}</p>
                        </div>
                    `;
                });
            }
            
            contentHtml = `
                <div class="panel-header">
                    <h3>${widget.title}</h3>
                    <button class="panel-menu"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                <div class="panel-content weather">
                    <div class="weather-main">
                        <i class="fas ${weatherData.icon || 'fa-sun'} weather-icon"></i>
                        <div class="weather-temp">${weatherData.temperature || ''}</div>
                        <div class="weather-day">${weatherData.day || ''}</div>
                    </div>
                    <div class="weather-forecast">
                        ${forecastHtml}
                    </div>
                </div>
            `;
        } else if (widget.type === 'devices') {
            const devicesData = widget.data_json ? JSON.parse(widget.data_json) : [];
            
            let devicesHtml = '';
            if (devicesData.length > 0) {
                devicesData.forEach(device => {
                    devicesHtml += `
                        <div class="device-card">
                            <div class="device-icon ${device.color}"><i class="fas ${device.icon}"></i></div>
                            <div class="device-info">
                                <p class="device-name">${device.name}</p>
                                <p class="device-status ${device.status_class}">${device.status}</p>
                            </div>
                        </div>
                    `;
                });
            }
            
            // Add "Add Device" button
            devicesHtml += `
                <div class="device-card">
                    <div class="add-device-btn">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            `;
            
            contentHtml = `
                <div class="section-header">
                    <h3>${widget.title}</h3>
                    <button class="panel-menu"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                <div class="device-cards">
                    ${devicesHtml}
                </div>
            `;
        }
        
        // Combine controls and content
        widgetElement.innerHTML = controlsHtml + contentHtml;
        
        return widgetElement;
    }
    
    // Initial dashboard setup - clone from personalize grid
    function syncDashboardWithPersonalize() {
        // Clear dashboard grid
        dashboardGrid.innerHTML = '';
        
        // Clone each widget from personalize grid to dashboard grid
        const widgets = personalizeGrid.querySelectorAll('.widget');
        widgets.forEach(widget => {
            const clone = widget.cloneNode(true);
            
            // Remove widget controls from dashboard view
            const controls = clone.querySelector('.widget-controls');
            if (controls) {
                controls.style.display = 'none';
            }
            
            // Remove resize handle from dashboard view
            const resizeHandle = clone.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.style.display = 'none';
            }
            
            dashboardGrid.appendChild(clone);
        });
    }
    
    // Tab switching
    dashboardNav.addEventListener('click', function(e) {
        e.preventDefault();
        dashboardNav.classList.add('active');
        personalizeNav.classList.remove('active');
        
        // Update dashboard grid with current personalize layout
        syncDashboardWithPersonalize();
        
        dashboardView.style.display = 'block';
        personalizeView.style.display = 'none';
    });
    
    personalizeNav.addEventListener('click', function(e) {
        e.preventDefault();
        personalizeNav.classList.add('active');
        dashboardNav.classList.remove('active');
        personalizeView.style.display = 'block';
        dashboardView.style.display = 'none';
    });
    
    // Widget removal functionality
    personalizeGrid.addEventListener('click', function(e) {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const widget = removeBtn.closest('.widget');
            if (widget) {
                widget.remove();
            }
        }
    });
    
    // Widget expand/shrink functionality
    personalizeGrid.addEventListener('click', function(e) {
        const expandBtn = e.target.closest('.expand-btn');
        const shrinkBtn = e.target.closest('.shrink-btn');
        
        if (expandBtn || shrinkBtn) {
            const widget = (expandBtn || shrinkBtn).closest('.widget');
            
            if (widget) {
                if (expandBtn) {
                    // Get current spans
                    const currentColSpan = parseInt(widget.getAttribute('data-col-span') || 1);
                    const currentRowSpan = parseInt(widget.getAttribute('data-row-span') || 1);
                    
                    // Determine new size based on current size
                    if (currentColSpan === 1 && currentRowSpan === 1) {
                        // Small -> Medium (2x1)
                        widget.classList.add('span-2-cols');
                        widget.setAttribute('data-col-span', '2');
                    } else if (currentColSpan === 2 && currentRowSpan === 1) {
                        // Medium -> Large (2x2)
                        widget.classList.add('span-2-rows');
                        widget.setAttribute('data-row-span', '2');
                    } else if (currentColSpan === 2 && currentRowSpan === 2) {
                        // Large -> XLarge (4x1)
                        widget.classList.remove('span-2-cols', 'span-2-rows');
                        widget.classList.add('span-4-cols');
                        widget.setAttribute('data-col-span', '4');
                        widget.setAttribute('data-row-span', '1');
                    }
                    
                    // Hide expand button if at maximum size
                    if (widget.classList.contains('span-4-cols')) {
                        expandBtn.style.display = 'none';
                    }
                    
                    // Show shrink button
                    const shrinkBtn = widget.querySelector('.shrink-btn');
                    if (shrinkBtn) {
                        shrinkBtn.style.display = 'flex';
                    }
                } else if (shrinkBtn) {
                    // Get current spans
                    const currentColSpan = parseInt(widget.getAttribute('data-col-span') || 1);
                    const currentRowSpan = parseInt(widget.getAttribute('data-row-span') || 1);
                    
                    // Determine new size based on current size
                    if (currentColSpan === 4 && currentRowSpan === 1) {
                        // XLarge -> Large (2x2)
                        widget.classList.remove('span-4-cols');
                        widget.classList.add('span-2-cols', 'span-2-rows');
                        widget.setAttribute('data-col-span', '2');
                        widget.setAttribute('data-row-span', '2');
                    } else if (currentColSpan === 2 && currentRowSpan === 2) {
                        // Large -> Medium (2x1)
                        widget.classList.remove('span-2-rows');
                        widget.setAttribute('data-row-span', '1');
                    } else if (currentColSpan === 2 && currentRowSpan === 1) {
                        // Medium -> Small (1x1)
                        widget.classList.remove('span-2-cols');
                        widget.setAttribute('data-col-span', '1');
                    }
                    
                    // Hide shrink button if at minimum size
                    if (currentColSpan === 1 && currentRowSpan === 1) {
                        shrinkBtn.style.display = 'none';
                    }
                    
                    // Show expand button
                    const expandBtn = widget.querySelector('.expand-btn');
                    if (expandBtn) {
                        expandBtn.style.display = 'flex';
                    }
                }
            }
        }
    });
    
    // Make widgets draggable in personalize mode
    let draggedWidget = null;
    let draggedWidgetRect = null;
    let draggedWidgetIndex = -1;
    let originalPosition = { x: 0, y: 0 };
    
    // Event handlers for dragging
    personalizeGrid.addEventListener('mousedown', function(e) {
        // Ensure we're not clicking a control button
        if (e.target.closest('.widget-controls') || e.target.closest('.panel-menu')) {
            return;
        }
        
        draggedWidget = e.target.closest('.widget');
        if (draggedWidget) {
            e.preventDefault();
            
            // Store original position
            draggedWidgetRect = draggedWidget.getBoundingClientRect();
            originalPosition = { x: e.clientX, y: e.clientY };
            
            // Get widget index
            const widgets = Array.from(personalizeGrid.children);
            draggedWidgetIndex = widgets.indexOf(draggedWidget);
            
            // Style changes when dragging
            draggedWidget.style.opacity = '0.8';
            draggedWidget.style.zIndex = '1000';
            draggedWidget.classList.add('dragging');
            
            // Add event listeners for drag and drop
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onDrop);
        }
    });
    
    function onDrag(e) {
        if (draggedWidget) {
            // Calculate new position
            const deltaX = e.clientX - originalPosition.x;
            const deltaY = e.clientY - originalPosition.y;
            
            // Apply new position
            draggedWidget.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            // Check for position changes
            const allWidgets = Array.from(personalizeGrid.children);
            const currentRect = draggedWidget.getBoundingClientRect();
            
            allWidgets.forEach((widget, index) => {
                if (widget !== draggedWidget) {
                    const rect = widget.getBoundingClientRect();
                    
                    // Check if centers of widgets are overlapping
                    const centerX1 = currentRect.left + currentRect.width / 2;
                    const centerY1 = currentRect.top + currentRect.height / 2;
                    const centerX2 = rect.left + rect.width / 2;
                    const centerY2 = rect.top + rect.height / 2;
                    
                    // Calculate overlap threshold
                    const overlapThresholdX = (currentRect.width + rect.width) / 4;
                    const overlapThresholdY = (currentRect.height + rect.height) / 4;
                    
                    // Check for significant overlap
                    const isOverlapping = Math.abs(centerX1 - centerX2) < overlapThresholdX && 
                                          Math.abs(centerY1 - centerY2) < overlapThresholdY;
                    
                    if (isOverlapping) {
                        // Visual indicator for swap target
                        widget.classList.add('swap-target');
                    } else {
                        widget.classList.remove('swap-target');
                    }
                }
            });
        }
    }
    
    function onDrop(e) {
        if (draggedWidget) {
            // Find if we're over another widget
            const allWidgets = Array.from(personalizeGrid.children);
            const currentRect = draggedWidget.getBoundingClientRect();
            let swapIndex = -1;
            
            allWidgets.forEach((widget, index) => {
                if (widget !== draggedWidget) {
                    const rect = widget.getBoundingClientRect();
                    
                    // Check if centers of widgets are overlapping
                    const centerX1 = currentRect.left + currentRect.width / 2;
                    const centerY1 = currentRect.top + currentRect.height / 2;
                    const centerX2 = rect.left + rect.width / 2;
                    const centerY2 = rect.top + rect.height / 2;
                    
                    // Calculate overlap threshold
                    const overlapThresholdX = (currentRect.width + rect.width) / 4;
                    const overlapThresholdY = (currentRect.height + rect.height) / 4;
                    
                    // Check for significant overlap
                    const isOverlapping = Math.abs(centerX1 - centerX2) < overlapThresholdX && 
                                          Math.abs(centerY1 - centerY2) < overlapThresholdY;
                    
                    if (isOverlapping) {
                        swapIndex = index;
                    }
                    
                    // Remove visual indicator
                    widget.classList.remove('swap-target');
                }
            });
            
            // Swap widgets if needed
            if (swapIndex !== -1 && swapIndex !== draggedWidgetIndex) {
                // Get the widget to swap with
                const swapWidget = allWidgets[swapIndex];
                
                // Handle the swap
                if (draggedWidgetIndex < swapIndex) {
                    // Moving forward
                    personalizeGrid.insertBefore(draggedWidget, swapWidget.nextSibling);
                } else {
                    // Moving backward
                    personalizeGrid.insertBefore(draggedWidget, swapWidget);
                }
            }
            
            // Reset styles
            draggedWidget.style.transform = '';
            draggedWidget.style.opacity = '';
            draggedWidget.style.zIndex = '';
            draggedWidget.classList.remove('dragging');
            
            // Clean up
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onDrop);
            draggedWidget = null;
        }
    }
    
    // Save Changes button functionality with PHP backend
    const saveChangesBtn = document.querySelector('.save-changes-btn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', async function() {
            // Get all widgets and their positions
            const widgets = Array.from(personalizeGrid.children);
            const widgetData = widgets.map((widget, index) => {
                return {
                    widget_id: widget.dataset.widgetId,
                    position: index,
                    column_span: parseInt(widget.dataset.colSpan || 1),
                    row_span: parseInt(widget.dataset.rowSpan || 1)
                };
            });
            
            try {
                // Save dashboard configuration to PHP backend
                const response = await fetch('api/save_dashboard.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(widgetData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                // Update dashboard view
                syncDashboardWithPersonalize();
                alert('Dashboard layout saved!');
                
                // Switch to dashboard view to show changes
                dashboardNav.click();
                
            } catch (error) {
                console.error('Error saving dashboard:', error);
                alert('Er is een fout opgetreden bij het opslaan van het dashboard.');
            }
        });
    }
    
    // Load widgets from API when the page loads
    fetchWidgets();
    
    // Initialization - ensure the correct view is shown based on the active tab
    if (personalizeNav.classList.contains('active')) {
        dashboardView.style.display = 'none';
        personalizeView.style.display = 'block';
    } else {
        syncDashboardWithPersonalize();
        dashboardView.style.display = 'block';
        personalizeView.style.display = 'none';
    }
}); 