<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

header('Content-Type: application/json');

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
if (!isset($input['user_id']) || !isset($input['widget_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: user_id, widget_id']);
    exit;
}

$userId = (int)$input['user_id'];
$widgetId = (int)$input['widget_id'];

// Optional fields with defaults
$title = isset($input['title']) ? $input['title'] : null;
$icon = isset($input['icon']) ? $input['icon'] : null;
$iconColor = isset($input['icon_color']) ? $input['icon_color'] : null;
$columnSpan = isset($input['column_span']) ? (int)$input['column_span'] : 1;
$rowSpan = isset($input['row_span']) ? (int)$input['row_span'] : 1;
$gridX = isset($input['grid_position_x']) ? (int)$input['grid_position_x'] : 0;
$gridY = isset($input['grid_position_y']) ? (int)$input['grid_position_y'] : 0;

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if widget exists and is active
    $checkStmt = $pdo->prepare("SELECT widget_id FROM widgets WHERE widget_id = ? AND is_active = TRUE");
    $checkStmt->execute([$widgetId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Widget not found or not active']);
        exit;
    }
    
    // Insert new user widget
    $stmt = $pdo->prepare("
        INSERT INTO user_widgets 
            (user_id, widget_id, title, icon, icon_color, column_span, row_span, 
            grid_position_x, grid_position_y, is_visible)
        VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    ");
    
    $stmt->execute([
        $userId, 
        $widgetId, 
        $title, 
        $icon, 
        $iconColor, 
        $columnSpan, 
        $rowSpan, 
        $gridX, 
        $gridY
    ]);
    
    // Get the inserted widget ID
    $newWidgetId = $pdo->lastInsertId();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Widget added successfully',
        'user_widget_id' => $newWidgetId
    ]);
    
} catch (PDOException $e) {
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 