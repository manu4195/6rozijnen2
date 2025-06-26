<?php
header('Content-Type: application/json');

try {
    // Get widget ID from request
    $widgetId = $_GET['widget_id'] ?? null;
    
    if (!$widgetId) {
        throw new Exception("Widget ID is required");
    }
    
    // Widget type configurations
    $widgetConfigs = [
        1 => [
            'title' => 'Zonnepaneelspanning',
            'icon' => 'fa-bolt',
            'icon_color' => '#FF9800',
            'widget_type' => 'chart'
        ],
        2 => [
            'title' => 'Zonnepaneelstroom',
            'icon' => 'fa-plug',
            'icon_color' => '#4CAF50',
            'widget_type' => 'chart'
        ],
        3 => [
            'title' => 'Waterstofproductie',
            'icon' => 'fa-flask',
            'icon_color' => '#2196F3',
            'widget_type' => 'chart'
        ],
        4 => [
            'title' => 'Stroomverbruik',
            'icon' => 'fa-bolt',
            'icon_color' => '#F44336',
            'widget_type' => 'chart'
        ],
        5 => [
            'title' => 'Buitentemperatuur',
            'icon' => 'fa-temperature-high',
            'icon_color' => '#9C27B0',
            'widget_type' => 'chart'
        ],
        6 => [
            'title' => 'Binnentemperatuur',
            'icon' => 'fa-home',
            'icon_color' => '#00BCD4',
            'widget_type' => 'chart'
        ],
        7 => [
            'title' => 'Accuniveau',
            'icon' => 'fa-battery-three-quarters',
            'icon_color' => '#8BC34A',
            'widget_type' => 'chart'
        ],
        8 => [
            'title' => 'Waterstofopslag',
            'icon' => 'fa-database',
            'icon_color' => '#3F51B5',
            'widget_type' => 'chart'
        ]
    ];
    
    if (!isset($widgetConfigs[$widgetId])) {
        throw new Exception("Invalid widget ID");
    }
    
    $config = $widgetConfigs[$widgetId];
    
    // Create new widget data
    $newWidget = [
        'user_widget_id' => 'new-' . $widgetId . '-' . time(),
        'widget_id' => $widgetId,
        'user_id' => 1,
        'widget_type' => $config['widget_type'],
        'title' => $config['title'],
        'icon' => $config['icon'],
        'icon_color' => $config['icon_color'],
        'column_span' => 3,
        'row_span' => 2,
        'grid_position_x' => 0,
        'grid_position_y' => 0,
        'is_visible' => true,
        'widget_data' => json_encode([
            'chart_type' => 'line',
            'data_source' => strtolower(str_replace(' ', '_', $config['title']))
        ])
    ];
    
    echo json_encode($newWidget);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => __FILE__,
        'line' => $e->getLine()
    ]);
}
?>