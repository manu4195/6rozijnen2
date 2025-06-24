<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

header('Content-Type: application/json');

// Check if widget_id is provided
if (!isset($_GET['widget_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing widget_id parameter']);
    exit;
}

$widgetId = (int)$_GET['widget_id'];

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Query to get widget details
    $stmt = $pdo->prepare("
        SELECT 
            widget_id,
            widget_name,
            widget_type,
            description,
            default_title,
            default_icon,
            default_icon_color,
            default_column_span,
            default_row_span
        FROM 
            widgets
        WHERE 
            widget_id = ? AND is_active = TRUE
    ");
    
    $stmt->execute([$widgetId]);
    $widget = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$widget) {
        http_response_code(404);
        echo json_encode(['error' => 'Widget not found']);
        exit;
    }
    
    // Return widget details
    echo json_encode($widget);
    
} catch (PDOException $e) {
    // Return error as JSON
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 