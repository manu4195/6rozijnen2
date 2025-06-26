<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

header('Content-Type: application/json');

// Enable error logging
error_log("Save widget request received");

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
    
    if (empty($data['widgets']) || !is_array($data['widgets'])) {
        throw new Exception('No widgets data provided or invalid format');
    }
    
    // In a real app, we would save to database
    // But for this dummy version, we just return success
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Widgets saved successfully',
        'data' => [
            'saved_count' => count($data['widgets'])
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