// Add function to create empty cells in the grid to visualize available positions
function addEmptyCellsToGrid() {
    const personalizeGrid = document.getElementById('personalize-grid');
    
    // Clear any existing empty cells
    const existingEmptyCells = personalizeGrid.querySelectorAll('.empty-cell');
    existingEmptyCells.forEach(cell => cell.remove());
    
    // Get all widgets in the grid
    const widgets = Array.from(personalizeGrid.querySelectorAll('.widget'));
    
    // Define grid size - 4 columns, 4 rows for example
    const columns = 4;
    const rows = 4;
    
    // Create a map of occupied cells based on widget positions and spans
    const occupiedCells = new Map();
    
    widgets.forEach(widget => {
        const colSpan = parseInt(widget.getAttribute('data-col-span') || 1);
        const rowSpan = parseInt(widget.getAttribute('data-row-span') || 1);
        const gridArea = window.getComputedStyle(widget).gridArea;
        
        // If grid area is defined, we can get the position
        if (gridArea && gridArea !== 'auto') {
            const [rowStart, colStart, rowEnd, colEnd] = gridArea.split(' / ').map(v => parseInt(v));
            
            // Mark all cells occupied by this widget
            for (let r = rowStart; r < rowEnd; r++) {
                for (let c = colStart; c < colEnd; c++) {
                    occupiedCells.set(`${r}-${c}`, true);
                }
            }
        }
    });
    
    // Add empty cells to all non-occupied positions
    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= columns; c++) {
            if (!occupiedCells.has(`${r}-${c}`)) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'empty-cell';
                emptyCell.innerHTML = '<i class="fas fa-plus"></i><div>Drop widget here</div>';
                emptyCell.style.gridRow = r;
                emptyCell.style.gridColumn = c;
                personalizeGrid.appendChild(emptyCell);
                
                // Make empty cells droppable
                emptyCell.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    this.classList.add('drag-over');
                });
                
                emptyCell.addEventListener('dragleave', function() {
                    this.classList.remove('drag-over');
                });
                
                emptyCell.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.classList.remove('drag-over');
                    
                    if (draggedWidget) {
                        // Position the widget in this cell
                        draggedWidget.style.gridRow = this.style.gridRow;
                        draggedWidget.style.gridColumn = this.style.gridColumn;
                        
                        // Remove the empty cell
                        this.remove();
                        
                        // Update the grid after placement
                        setTimeout(addEmptyCellsToGrid, 100);
                    }
                });
            }
        }
    }
}

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
        
        // Pre-create empty cells but they'll be invisible until dragging
        addEmptyCellsToGrid();
    });
    
    // Function to show/hide grid visualization
    function toggleGridVisualization(show) {
        const personalizeGrid = document.getElementById('personalize-grid');
        if (show) {
            personalizeGrid.classList.add('dragging-active');
        } else {
            personalizeGrid.classList.remove('dragging-active');
        }
    }
    
    // Widget removal functionality
    personalizeGrid.addEventListener('click', function(e) {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const widget = removeBtn.closest('.widget');
            if (widget) {
                widget.remove();
                
                // Update empty cells after removal
                addEmptyCellsToGrid();
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
                
                // Update empty cells after resizing
                addEmptyCellsToGrid();
            }
        }
    });
    
    // Make widgets draggable in personalize mode
    let draggedWidget = null;
    let draggedWidgetRect = null;
    let draggedWidgetIndex = -1;
    let originalPosition = { x: 0, y: 0 };
    
    // Enable HTML5 Drag and Drop for widgets
    const widgets = personalizeGrid.querySelectorAll('.widget');
    widgets.forEach(widget => {
        widget.setAttribute('draggable', 'true');
        
        widget.addEventListener('dragstart', function(e) {
            draggedWidget = this;
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
            
            // Add placeholder styling
            this.classList.add('dragging');
            
            // Store original widget index
            draggedWidgetIndex = Array.from(personalizeGrid.children).indexOf(this);
            
            // Show grid visualization when dragging starts
            toggleGridVisualization(true);
        });
        
        widget.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedWidget = null;
            
            // Hide grid visualization when dragging ends
            toggleGridVisualization(false);
        });
    });
    
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
            
            // Show grid visualization when dragging starts
            toggleGridVisualization(true);
            
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
            
            // Hide grid visualization when dragging ends
            toggleGridVisualization(false);
            
            // Clean up
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onDrop);
            draggedWidget = null;
            
            // Update empty cells after dropping
            addEmptyCellsToGrid();
        }
    }
    
    // Save Changes button functionality
    const saveChangesBtn = document.querySelector('.save-changes-btn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', function() {
            // Remove empty cells before syncing
            const emptyCells = personalizeGrid.querySelectorAll('.empty-cell');
            emptyCells.forEach(cell => cell.remove());
            
            syncDashboardWithPersonalize();
            alert('Dashboard layout saved!');
            
            // Switch to dashboard view to show changes
            dashboardNav.click();
        });
    }
    
    // Initialize the dashboard view with personalize layout
    syncDashboardWithPersonalize();
    
    // Initialization - ensure the correct view is shown based on the active tab
    if (personalizeNav.classList.contains('active')) {
        dashboardView.style.display = 'none';
        personalizeView.style.display = 'block';
        
        // Pre-create empty cells but they'll be invisible until dragging
        setTimeout(addEmptyCellsToGrid, 100);
    } else {
        syncDashboardWithPersonalize();
        dashboardView.style.display = 'block';
        personalizeView.style.display = 'none';
    }
}); 