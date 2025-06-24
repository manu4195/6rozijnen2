<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

header('Content-Type: application/json');

// Get user_widget_id from either GET or POST
$userWidgetId = 0;
$userId = 1; // Default user ID

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get parameters from query string
    $userWidgetId = isset($_GET['user_widget_id']) ? (int)$_GET['user_widget_id'] : 0;
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }
    
    // Get parameters from POST data
    $userWidgetId = isset($input['user_widget_id']) ? (int)$input['user_widget_id'] : 0;
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 1;
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use GET or POST.']);
    exit;
}

// Validate required parameter
if ($userWidgetId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameter: user_widget_id']);
    exit;
}

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Update widget to make it visible again
    $stmt = $pdo->prepare("
        UPDATE user_widgets 
        SET is_visible = TRUE
        WHERE user_widget_id = ? AND user_id = ?
    ");
    
    $stmt->execute([$userWidgetId, $userId]);
    
    // Check if any rows were affected
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Widget not found or not owned by user']);
        exit;
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Widget restored successfully'
    ]);
    
} catch (PDOException $e) {
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 