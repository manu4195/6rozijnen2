<?php
header('Content-Type: application/json');

// Get user_id from query string
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;

try {
    // Create dummy data for hidden widgets
    $hiddenWidgets = [
        [
            'user_widget_id' => 101,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Hidden Widget 1',
            'icon' => 'fa-chart-line',
            'icon_color' => '#9C27B0',
            'column_span' => 3,
            'row_span' => 2,
            'grid_position_x' => 0,
            'grid_position_y' => 0,
            'is_visible' => false,
            'widget_data' => [
                'chart_type' => 'line',
                'labels' => ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                'values' => [3.2, 3.8, 4.1, 3.7, 3.2, 2.8, 2.5, 2.1],
                'unit' => 'kWh'
            ]
        ],
        [
            'user_widget_id' => 102,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Hidden Widget 2',
            'icon' => 'fa-database',
            'icon_color' => '#3F51B5',
            'column_span' => 3,
            'row_span' => 2,
            'grid_position_x' => 3,
            'grid_position_y' => 0,
            'is_visible' => false,
            'widget_data' => [
                'chart_type' => 'bar',
                'labels' => ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                'values' => [5.2, 5.8, 6.1, 5.7, 5.2, 4.8, 4.5, 4.1],
                'unit' => 'kWh'
            ]
        ]
    ];
    
    // Return hidden widgets as JSON
    echo json_encode($hiddenWidgets);
    
} catch (Exception $e) {
    // Handle any exceptions
    http_response_code(500);
    echo json_encode([
        'error' => 'Error: ' . $e->getMessage(),
        'details' => [
            'file' => __FILE__,
            'line' => $e->getLine()
        ]
    ]);
}
?> 