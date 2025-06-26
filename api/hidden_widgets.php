<?php
header('Content-Type: application/json');

try {
    // Get user ID from request
    $userId = $_GET['user_id'] ?? 1;
    
    // For demo purposes, return empty array (no hidden widgets initially)
    $hiddenWidgets = [];
    
    echo json_encode($hiddenWidgets);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => __FILE__,
        'line' => $e->getLine()
    ]);
}
?>