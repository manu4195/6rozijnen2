<?php
header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Please use POST.']);
    exit;
}

try {
    // Get the JSON data from the request
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);
    
    // Validate data
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data provided');
    }
    
    if (!isset($data['user_widget_id']) || !isset($data['user_id'])) {
        throw new Exception('Missing required fields: user_widget_id, user_id');
    }
    
    // In a real app, we would restore the widget in the database
    // But for this dummy version, we just return a success response
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Widget restored successfully',
        'widget' => [
            'user_widget_id' => $data['user_widget_id'],
            'user_id' => $data['user_id'],
            'widget_type' => 'chart',
            'title' => 'Restored Widget',
            'icon' => 'fa-chart-line',
            'icon_color' => '#4CAF50',
            'column_span' => 3,
            'row_span' => 2,
            'grid_position_x' => 0,
            'grid_position_y' => 0,
            'is_visible' => true,
            'widget_data' => [
                'chart_type' => 'line',
                'labels' => ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                'values' => [0.5, 1.8, 3.2, 4.5, 4.2, 3.0, 1.5, 0.2],
                'unit' => 'kWh'
            ]
        ]
    ]);
    
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