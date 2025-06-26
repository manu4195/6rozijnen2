<?php
header('Content-Type: application/json');

try {
    // Path to the CSV file
    $csvFile = __DIR__ . '/Data.csv';
    
    // Check if the file exists
    if (!file_exists($csvFile)) {
        throw new Exception("CSV file not found: $csvFile");
    }
    
    // Get request parameters
    $endpoint = $_GET['endpoint'] ?? 'latest';
    $column = $_GET['column'] ?? '';
    $limit = intval($_GET['limit'] ?? 24);
    
    // Read and parse the CSV file
    $csvContent = file_get_contents($csvFile);
    $lines = explode("\n", $csvContent);
    
    // Get headers from first line
    $headerLine = array_shift($lines);
    $headers = str_getcsv($headerLine, ';');
    
    // Clean headers (remove BOM and trim)
    $headers = array_map(function($header) {
        return trim($header, "\xEF\xBB\xBF\x00..\x20");
    }, $headers);
    
    $data = [];
    $rowCount = 0;
    
    // Read data rows
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $rowCount >= 500) break;
        
        $row = str_getcsv($line, ';');
        if (count($row) >= count($headers) && !empty(trim($row[0]))) {
            $rowData = array_combine($headers, $row);
            $data[] = $rowData;
            $rowCount++;
        }
    }
    
    if ($endpoint === 'latest') {
        // Return latest data point
        $latest = end($data);
        if ($latest) {
            echo json_encode($latest);
        } else {
            echo json_encode([]);
        }
    } elseif ($endpoint === 'timeseries') {
        // Return time series data for specific column
        if (empty($column)) {
            throw new Exception("Column parameter required for timeseries endpoint");
        }
        
        // Find column index
        $columnExists = false;
        foreach ($headers as $header) {
            if (trim($header) === trim($column)) {
                $columnExists = true;
                break;
            }
        }
        
        if (!$columnExists) {
            throw new Exception("Column '$column' not found. Available columns: " . implode(', ', $headers));
        }
        
        $values = [];
        $labels = [];
        $count = 0;
        
        // Get last N data points
        $reversedData = array_reverse($data);
        foreach ($reversedData as $row) {
            if ($count >= $limit) break;
            
            $value = trim($row[$column] ?? '');
            $timestamp = trim($row['Tijdstip'] ?? '');
            
            // Convert comma decimal separator to dot
            $value = str_replace(',', '.', $value);
            
            if (is_numeric($value) && !empty($timestamp)) {
                $values[] = floatval($value);
                
                // Format timestamp for display
                if (preg_match('/(\d{1,2}-\d{1,2}-\d{4})\s+(\d{1,2}:\d{2})/', $timestamp, $matches)) {
                    $labels[] = $matches[2]; // Just show time
                } else {
                    $labels[] = substr($timestamp, -5); // Last 5 characters
                }
                $count++;
            }
        }
        
        // Reverse to get chronological order
        $values = array_reverse($values);
        $labels = array_reverse($labels);
        
        // Determine unit based on column name
        $unit = '';
        if (strpos($column, '(V)') !== false) $unit = 'V';
        elseif (strpos($column, '(A)') !== false) $unit = 'A';
        elseif (strpos($column, '(L/u)') !== false) $unit = 'L/u';
        elseif (strpos($column, '(kW)') !== false) $unit = 'kW';
        elseif (strpos($column, '(°C)') !== false) $unit = '°C';
        elseif (strpos($column, '(%)') !== false) $unit = '%';
        elseif (strpos($column, '(hPa)') !== false) $unit = 'hPa';
        elseif (strpos($column, '(ppm)') !== false) $unit = 'ppm';
        
        echo json_encode([
            'values' => $values,
            'labels' => $labels,
            'unit' => $unit,
            'column' => $column,
            'count' => count($values)
        ]);
    } else {
        throw new Exception("Invalid endpoint. Use 'latest' or 'timeseries'");
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => __FILE__,
        'line' => $e->getLine()
    ]);
}
?>
    ]);
}
?>
