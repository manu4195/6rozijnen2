<?php
header('Content-Type: application/json');

// Get widget_id from query string or POST data
$widgetId = isset($_GET['widget_id']) ? (int)$_GET['widget_id'] : 0;
if ($widgetId <= 0 && isset($_POST['widget_id'])) {
    $widgetId = (int)$_POST['widget_id'];
}

// Validate required parameter
if ($widgetId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameter: widget_id']);
    exit;
}

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
    
    // Get a random line from CSV for this widget's data
    $randomLineIndex = rand(1, count($lines) - 1);
    $randomLine = $lines[$randomLineIndex];
    
    // Skip empty lines
    while (empty(trim($randomLine)) && $randomLineIndex < count($lines) - 1) {
        $randomLineIndex++;
        $randomLine = $lines[$randomLineIndex];
    }
    
    // Parse the CSV line
    $data = str_getcsv($randomLine, ';');
    
    // Skip if there's not enough data
    if (count($data) < count($headers)) {
        throw new Exception("Invalid CSV data format");
    }
    
    // Combine headers with data to create an associative array
    $rowData = array_combine($headers, $data);
    
    // Get column name based on widget ID
    $columnName = '';
    $widgetName = '';
    $iconName = '';
    $iconColor = '';
    
    switch ($widgetId % 8) {
        case 1:
            $columnName = 'Zonnepaneelspanning (V)';
            $widgetName = 'Zonnepaneelspanning';
            $iconName = 'fa-bolt';
            $iconColor = '#FF9800';
            break;
        case 2:
            $columnName = 'Zonnepaneelstroom (A)';
            $widgetName = 'Zonnepaneelstroom';
            $iconName = 'fa-plug';
            $iconColor = '#4CAF50';
            break;
        case 3:
            $columnName = 'Waterstofproductie (L/u)';
            $widgetName = 'Waterstofproductie';
            $iconName = 'fa-flask';
            $iconColor = '#2196F3';
            break;
        case 4:
            $columnName = 'Stroomverbruik woning (kW)';
            $widgetName = 'Stroomverbruik';
            $iconName = 'fa-home';
            $iconColor = '#F44336';
            break;
        case 5:
            $columnName = 'Buitentemperatuur (°C)';
            $widgetName = 'Buitentemperatuur';
            $iconName = 'fa-temperature-high';
            $iconColor = '#FF5722';
            break;
        case 6:
            $columnName = 'Binnentemperatuur (°C)';
            $widgetName = 'Binnentemperatuur';
            $iconName = 'fa-home';
            $iconColor = '#9C27B0';
            break;
        case 7:
            $columnName = 'Accuniveau (%)';
            $widgetName = 'Accuniveau';
            $iconName = 'fa-battery-three-quarters';
            $iconColor = '#3F51B5';
            break;
        default:
            $columnName = 'Waterstofopslag woning (%)';
            $widgetName = 'Waterstofopslag';
            $iconName = 'fa-database';
            $iconColor = '#009688';
            break;
    }
    
    // Generate a unique user_widget_id
    $userWidgetId = time() . rand(100, 999);
    
    // Create a new widget with data from CSV
    $newWidget = [
        'user_widget_id' => $userWidgetId,
        'user_id' => 1,
        'widget_id' => $widgetId,
        'widget_type' => 'chart',
        'title' => $widgetName,
        'icon' => $iconName,
        'icon_color' => $iconColor,
        'column_span' => 3,
        'row_span' => 2,
        'grid_position_x' => 0,
        'grid_position_y' => 0,
        'is_visible' => true,
        'widget_data' => $rowData
    ];
    
    // Return the new widget as JSON
    echo json_encode($newWidget);
    
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