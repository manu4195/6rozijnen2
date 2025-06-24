<?php
header('Content-Type: application/json');

try {
    // Path to the CSV file
    $csvFile = __DIR__ . '/Data.csv';
    
    // Check if the file exists
    if (!file_exists($csvFile)) {
        throw new Exception("CSV file not found: $csvFile");
    }
    
    // Read the CSV file
    $csvData = file_get_contents($csvFile);
    
    // Split the content into lines
    $lines = explode("\n", $csvData);
    
    // Get headers from first line and convert them to keys
    $headers = str_getcsv(array_shift($lines), ';');
    
    // Initialize an empty array for widgets
    $widgets = [];
    
    // Process each line
    foreach ($lines as $index => $line) {
        // Skip empty lines
        if (empty(trim($line))) {
            continue;
        }
        
        // Parse the CSV line
        $data = str_getcsv($line, ';');
        
        // Skip if there's not enough data
        if (count($data) < count($headers)) {
            continue;
        }
        
        // Combine headers with data to create an associative array
        $rowData = array_combine($headers, $data);
        
        // Create widget data from the CSV row
        $widget = [
            'user_widget_id' => $index + 1,
            'user_id' => 1,
            'widget_type' => 'chart',
            'title' => 'Sensor Data ' . ($rowData['Tijdstip'] ? substr($rowData['Tijdstip'], 11, 5) : ''),
            'icon' => 'fa-chart-line',
            'icon_color' => '#4CAF50',
            'column_span' => 3,
            'row_span' => 2,
            'grid_position_x' => ($index % 4) * 3,
            'grid_position_y' => floor($index / 4) * 2,
            'is_visible' => true,
            'widget_data' => $rowData
        ];
        
        // Add the widget to the array
        $widgets[] = $widget;
        
        // Limit to 20 widgets to avoid performance issues
        if (count($widgets) >= 8) {
            break;
        }
    }
    
    // Return widgets as JSON
    echo json_encode($widgets, JSON_NUMERIC_CHECK);
    
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