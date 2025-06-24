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
    
    // Check if dashboard_widgets view exists
    $checkView = $pdo->query("SHOW TABLES LIKE 'dashboard_widgets'");
    $viewExists = $checkView->rowCount() > 0;
    
    if (!$viewExists) {
        // If view doesn't exist, use a direct query instead
        $stmt = $pdo->prepare("
            SELECT 
                uw.user_widget_id,
                uw.user_id,
                w.widget_type,
                COALESCE(uw.title, w.default_title) AS title,
                COALESCE(uw.icon, w.default_icon) AS icon,
                COALESCE(uw.icon_color, w.default_icon_color) AS icon_color,
                uw.column_span,
                uw.row_span,
                uw.grid_position_x,
                uw.grid_position_y,
                uw.is_visible,
                uw.widget_data,
                uw.widget_id
            FROM 
                user_widgets uw
            JOIN 
                widgets w ON uw.widget_id = w.widget_id
            WHERE 
                uw.user_id = ? AND uw.is_visible = TRUE
            ORDER BY 
                uw.grid_position_y, uw.grid_position_x
        ");
        $stmt->execute([$userId]);
    } else {
        // Use the dashboard_widgets view if it exists
        $stmt = $pdo->prepare("SELECT * FROM dashboard_widgets WHERE user_id = ? AND is_visible = TRUE ORDER BY grid_position_y, grid_position_x");
        $stmt->execute([$userId]);
    }
    
    $widgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ensure widget_data is properly parsed JSON
    foreach ($widgets as &$widget) {
        if (isset($widget['widget_data']) && is_string($widget['widget_data'])) {
            $widget['widget_data'] = json_decode($widget['widget_data'], true);
        }
    }
    
    // Return widgets as JSON
    echo json_encode($widgets);
    
} catch (PDOException $e) {
    // Return error as JSON with more details
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage(),
        'details' => [
            'file' => __FILE__,
            'line' => $e->getLine()
        ]
    ]);
} catch (Exception $e) {
    // Handle any other exceptions
    http_response_code(500);
    echo json_encode([
        'error' => 'General error: ' . $e->getMessage(),
        'details' => [
            'file' => __FILE__,
            'line' => $e->getLine()
        ]
    ]);
}
?> 