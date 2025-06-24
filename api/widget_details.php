<?php
header('Content-Type: application/json');

// Get widget_id from query string
$widgetId = isset($_GET['widget_id']) ? (int)$_GET['widget_id'] : 0;

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
    
    // Create arrays to store time labels and data values
    $labels = [];
    $values = [];
    
    // Get column name based on widget ID
    $columnName = '';
    $widgetName = '';
    $iconName = '';
    $iconColor = '';
    $unit = '';
    
    switch ($widgetId % 8) {
        case 1:
            $columnName = 'Zonnepaneelspanning (V)';
            $widgetName = 'Zonnepaneelspanning';
            $iconName = 'fa-bolt';
            $iconColor = '#FF9800';
            $unit = 'V';
            break;
        case 2:
            $columnName = 'Zonnepaneelstroom (A)';
            $widgetName = 'Zonnepaneelstroom';
            $iconName = 'fa-plug';
            $iconColor = '#4CAF50';
            $unit = 'A';
            break;
        case 3:
            $columnName = 'Waterstofproductie (L/u)';
            $widgetName = 'Waterstofproductie';
            $iconName = 'fa-flask';
            $iconColor = '#2196F3';
            $unit = 'L/u';
            break;
        case 4:
            $columnName = 'Stroomverbruik woning (kW)';
            $widgetName = 'Stroomverbruik';
            $iconName = 'fa-home';
            $iconColor = '#F44336';
            $unit = 'kW';
            break;
        case 5:
            $columnName = 'Buitentemperatuur (°C)';
            $widgetName = 'Buitentemperatuur';
            $iconName = 'fa-temperature-high';
            $iconColor = '#FF5722';
            $unit = '°C';
            break;
        case 6:
            $columnName = 'Binnentemperatuur (°C)';
            $widgetName = 'Binnentemperatuur';
            $iconName = 'fa-home';
            $iconColor = '#9C27B0';
            $unit = '°C';
            break;
        case 7:
            $columnName = 'Accuniveau (%)';
            $widgetName = 'Accuniveau';
            $iconName = 'fa-battery-three-quarters';
            $iconColor = '#3F51B5';
            $unit = '%';
            break;
        default:
            $columnName = 'Waterstofopslag woning (%)';
            $widgetName = 'Waterstofopslag';
            $iconName = 'fa-database';
            $iconColor = '#009688';
            $unit = '%';
            break;
    }
    
    // Process each line to extract time and values
    foreach ($lines as $line) {
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
        
        // Extract time (HH:MM) from the Tijdstip column
        if (isset($rowData['Tijdstip'])) {
            $timeLabel = substr($rowData['Tijdstip'], 11, 5); // Extract HH:MM
            $labels[] = $timeLabel;
            
            // Extract value from the selected column
            if (isset($rowData[$columnName])) {
                // Replace comma with dot for correct numeric value
                $values[] = floatval(str_replace(',', '.', $rowData[$columnName]));
            } else {
                $values[] = 0;
            }
        }
        
        // Limit to 24 data points to avoid performance issues
        if (count($labels) >= 24) {
            break;
        }
    }
    
    // Create widget details with data from CSV
    $widgetDetails = [
        'widget_id' => $widgetId,
        'widget_name' => $widgetName,
        'widget_type' => 'chart',
        'description' => 'Toont ' . $widgetName . ' gegevens uit Data.csv',
        'default_title' => $widgetName,
        'default_icon' => $iconName,
        'default_icon_color' => $iconColor,
        'default_column_span' => 3,
        'default_row_span' => 2,
        'default_data' => [
            'chart_type' => 'line',
            'labels' => $labels,
            'values' => $values,
            'unit' => $unit
        ]
    ];
    
    // Return widget details as JSON
    echo json_encode($widgetDetails);
    
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