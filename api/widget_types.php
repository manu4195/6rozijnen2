<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

// Set header to JSON
header('Content-Type: application/json');

try {
    // Create database connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user ID (in a real app, this would come from the session)
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1; // Default to first user
    
    // Query to get all available widget types from the widgets table
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
            is_active = TRUE
        ORDER BY
            widget_name
    ");
    
    $stmt->execute();
    
    // Fetch results as associative array
    $widgetTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check if user already has these widgets
    $userWidgetsStmt = $pdo->prepare("
        SELECT widget_id
        FROM user_widgets
        WHERE user_id = ? AND is_visible = TRUE
    ");
    
    $userWidgetsStmt->execute([$userId]);
    $userWidgets = $userWidgetsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Mark widgets that are already on the dashboard
    foreach ($widgetTypes as &$widget) {
        $widget['already_added'] = in_array($widget['widget_id'], $userWidgets);
    }
    
    // Return JSON response
    echo json_encode($widgetTypes);
    
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 