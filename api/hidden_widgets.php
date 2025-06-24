<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

header('Content-Type: application/json');

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user ID (in a real app, this would come from the session)
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1; // Default to first user
    
    // Query to get hidden widgets
    $stmt = $pdo->prepare("
        SELECT 
            uw.user_widget_id,
            uw.user_id,
            uw.widget_id,
            w.widget_type,
            COALESCE(uw.title, w.default_title) AS title,
            COALESCE(uw.icon, w.default_icon) AS icon,
            COALESCE(uw.icon_color, w.default_icon_color) AS icon_color,
            w.description,
            uw.column_span,
            uw.row_span,
            uw.widget_data
        FROM 
            user_widgets uw
        JOIN 
            widgets w ON uw.widget_id = w.widget_id
        WHERE 
            uw.user_id = ? AND
            uw.is_visible = FALSE
        ORDER BY 
            uw.last_updated DESC
    ");
    $stmt->execute([$userId]);
    $widgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return widgets as JSON
    echo json_encode($widgets);
    
} catch (PDOException $e) {
    // Return error as JSON
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 