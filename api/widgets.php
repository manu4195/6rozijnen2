<?php
header('Content-Type: application/json');

try {
    // Get user ID from request
    $userId = $_GET['user_id'] ?? 1;
    
    // Return default widgets for the dashboard
    $widgets = [
        [
            'user_widget_id' => 1,
            'widget_id' => 1,
            'user_id' => $userId,
            'widget_type' => 'stat-card',
            'title' => 'Zonne-energie Productie',
            'icon' => 'fa-sun',
            'icon_color' => '#4CAF50',
            'column_span' => 4,
            'row_span' => 2,
            'grid_position_x' => 0,
            'grid_position_y' => 0,
            'is_visible' => true,
            'widget_data' => json_encode([
                'value' => '24.8 kWh',
                'secondary_value' => '+12% vs gisteren',
                'is_positive' => true
            ])
        ],
        [
            'user_widget_id' => 2,
            'widget_id' => 2,
            'user_id' => $userId,
            'widget_type' => 'stat-card',
            'title' => 'Stroomverbruik',
            'icon' => 'fa-bolt',
            'icon_color' => '#E91E63',
            'column_span' => 4,
            'row_span' => 2,
            'grid_position_x' => 4,
            'grid_position_y' => 0,
            'is_visible' => true,
            'widget_data' => json_encode([
                'value' => '18.2 kWh',
                'secondary_value' => '-15% vs gisteren',
                'is_positive' => false
            ])
        ],
        [
            'user_widget_id' => 3,
            'widget_id' => 3,
            'user_id' => $userId,
            'widget_type' => 'stat-card',
            'title' => 'Batterij Status',
            'icon' => 'fa-battery-three-quarters',
            'icon_color' => '#2196F3',
            'column_span' => 4,
            'row_span' => 2,
            'grid_position_x' => 8,
            'grid_position_y' => 0,
            'is_visible' => true,
            'widget_data' => json_encode([
                'value' => '78%',
                'secondary_value' => '6.2 kWh opgeslagen',
                'is_positive' => null
            ])
        ],
        [
            'user_widget_id' => 4,
            'widget_id' => 4,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Energie Productie',
            'icon' => 'fa-chart-line',
            'icon_color' => '#4CAF50',
            'column_span' => 6,
            'row_span' => 3,
            'grid_position_x' => 0,
            'grid_position_y' => 2,
            'is_visible' => true,
            'widget_data' => json_encode([
                'chart_type' => 'line',
                'data_source' => 'solar_production'
            ])
        ],
        [
            'user_widget_id' => 5,
            'widget_id' => 5,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Energieverbruik',
            'icon' => 'fa-chart-line',
            'icon_color' => '#E91E63',
            'column_span' => 6,
            'row_span' => 3,
            'grid_position_x' => 6,
            'grid_position_y' => 2,
            'is_visible' => true,
            'widget_data' => json_encode([
                'chart_type' => 'line',
                'data_source' => 'consumption'
            ])
        ],
        [
            'user_widget_id' => 6,
            'widget_id' => 6,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Opslagstatus',
            'icon' => 'fa-chart-bar',
            'icon_color' => '#2196F3',
            'column_span' => 4,
            'row_span' => 3,
            'grid_position_x' => 0,
            'grid_position_y' => 5,
            'is_visible' => true,
            'widget_data' => json_encode([
                'chart_type' => 'bar',
                'data_source' => 'storage_levels'
            ])
        ],
        [
            'user_widget_id' => 7,
            'widget_id' => 7,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Temperatuur',
            'icon' => 'fa-temperature-high',
            'icon_color' => '#FF5722',
            'column_span' => 4,
            'row_span' => 3,
            'grid_position_x' => 4,
            'grid_position_y' => 5,
            'is_visible' => true,
            'widget_data' => json_encode([
                'chart_type' => 'line',
                'data_source' => 'temperature'
            ])
        ],
        [
            'user_widget_id' => 8,
            'widget_id' => 8,
            'user_id' => $userId,
            'widget_type' => 'chart',
            'title' => 'Waterstofproductie',
            'icon' => 'fa-flask',
            'icon_color' => '#FF9800',
            'column_span' => 4,
            'row_span' => 3,
            'grid_position_x' => 8,
            'grid_position_y' => 5,
            'is_visible' => true,
            'widget_data' => json_encode([
                'chart_type' => 'line',
                'data_source' => 'hydrogen_production'
            ])
        ]
    ];
    
    // Return widgets as JSON
    echo json_encode($widgets);
    
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