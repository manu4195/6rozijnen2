<?php
// Set header to JSON
header('Content-Type: application/json');

try {
    // Hardcoded widget types for demo
    $widgetTypes = [
        [
            'widget_id' => 1,
            'widget_name' => 'Zonnepaneelspanning',
            'widget_type' => 'chart',
            'description' => 'Toont de voltage van de zonnepanelen over tijd',
            'default_title' => 'Zonnepaneelspanning',
            'default_icon' => 'fa-bolt',
            'default_icon_color' => '#FF9800',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 2,
            'widget_name' => 'Zonnepaneelstroom',
            'widget_type' => 'chart',
            'description' => 'Toont de stroom van de zonnepanelen over tijd',
            'default_title' => 'Zonnepaneelstroom',
            'default_icon' => 'fa-plug',
            'default_icon_color' => '#4CAF50',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 3,
            'widget_name' => 'Waterstofproductie',
            'widget_type' => 'chart',
            'description' => 'Toont de waterstofproductie over tijd',
            'default_title' => 'Waterstofproductie',
            'default_icon' => 'fa-flask',
            'default_icon_color' => '#2196F3',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 4,
            'widget_name' => 'Stroomverbruik',
            'widget_type' => 'chart',
            'description' => 'Toont het stroomverbruik van de woning over tijd',
            'default_title' => 'Stroomverbruik',
            'default_icon' => 'fa-bolt',
            'default_icon_color' => '#F44336',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 5,
            'widget_name' => 'Buitentemperatuur',
            'widget_type' => 'chart',
            'description' => 'Toont de buitentemperatuur over tijd',
            'default_title' => 'Buitentemperatuur',
            'default_icon' => 'fa-temperature-high',
            'default_icon_color' => '#9C27B0',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 6,
            'widget_name' => 'Binnentemperatuur',
            'widget_type' => 'chart',
            'description' => 'Toont de binnentemperatuur over tijd',
            'default_title' => 'Binnentemperatuur',
            'default_icon' => 'fa-home',
            'default_icon_color' => '#00BCD4',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 7,
            'widget_name' => 'Accuniveau',
            'widget_type' => 'chart',
            'description' => 'Toont het accuniveau over tijd',
            'default_title' => 'Accuniveau',
            'default_icon' => 'fa-battery-three-quarters',
            'default_icon_color' => '#8BC34A',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ],
        [
            'widget_id' => 8,
            'widget_name' => 'Waterstofopslag',
            'widget_type' => 'chart',
            'description' => 'Toont het waterstofopslagpercentage over tijd',
            'default_title' => 'Waterstofopslag',
            'default_icon' => 'fa-database',
            'default_icon_color' => '#3F51B5',
            'default_column_span' => 3,
            'default_row_span' => 2,
            'already_added' => false
        ]
    ];
    
    // Return JSON response
    echo json_encode($widgetTypes);
    
} catch (Exception $e) {
    // Handle errors
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
?> 