<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

header('Content-Type: application/json');

// Enable error logging
error_log("Save widget request received");

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
if (!isset($input['user_id']) || !isset($input['widgets'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: user_id, widgets']);
    exit;
}

$userId = (int)$input['user_id'];
$widgets = $input['widgets'];

error_log("Processing save request for user ID: $userId with " . count($widgets) . " widgets");

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Start a transaction
    $pdo->beginTransaction();
    
    $updatedCount = 0;
    $insertedCount = 0;
    
    // Update existing widgets or add new ones
    foreach ($widgets as $widget) {
        // Ensure grid positions are integers
        $grid_position_x = isset($widget['grid_position_x']) ? (int)$widget['grid_position_x'] : 0;
        $grid_position_y = isset($widget['grid_position_y']) ? (int)$widget['grid_position_y'] : 0;
        $column_span = isset($widget['column_span']) ? (int)$widget['column_span'] : 1;
        $row_span = isset($widget['row_span']) ? (int)$widget['row_span'] : 1;
        
        error_log("Processing widget: " . json_encode($widget));
        
        if (isset($widget['user_widget_id']) && $widget['user_widget_id'] > 0) {
            // Update existing widget
            $stmt = $pdo->prepare("
                UPDATE user_widgets 
                SET 
                    title = :title,
                    column_span = :column_span,
                    row_span = :row_span,
                    grid_position_x = :grid_position_x,
                    grid_position_y = :grid_position_y,
                    is_visible = :is_visible,
                    widget_data = :widget_data
                WHERE 
                    user_widget_id = :user_widget_id AND
                    user_id = :user_id
            ");
            
            $params = [
                'title' => $widget['title'],
                'column_span' => $column_span,
                'row_span' => $row_span,
                'grid_position_x' => $grid_position_x,
                'grid_position_y' => $grid_position_y,
                'is_visible' => isset($widget['is_visible']) ? $widget['is_visible'] : true,
                'widget_data' => json_encode(isset($widget['widget_data']) ? $widget['widget_data'] : []),
                'user_widget_id' => (int)$widget['user_widget_id'],
                'user_id' => $userId
            ];
            
            $stmt->execute($params);
            
            error_log("Updated widget ID: " . $widget['user_widget_id'] . ", Rows affected: " . $stmt->rowCount());
            $updatedCount += $stmt->rowCount();
            
        } elseif (isset($widget['widget_id'])) {
            // Insert new widget
            $stmt = $pdo->prepare("
                INSERT INTO user_widgets 
                    (user_id, widget_id, title, column_span, row_span, 
                    grid_position_x, grid_position_y, is_visible, widget_data)
                VALUES 
                    (:user_id, :widget_id, :title, :column_span, :row_span, 
                    :grid_position_x, :grid_position_y, :is_visible, :widget_data)
            ");
            
            $params = [
                'user_id' => $userId,
                'widget_id' => (int)$widget['widget_id'],
                'title' => $widget['title'],
                'column_span' => $column_span,
                'row_span' => $row_span,
                'grid_position_x' => $grid_position_x,
                'grid_position_y' => $grid_position_y,
                'is_visible' => isset($widget['is_visible']) ? $widget['is_visible'] : true,
                'widget_data' => json_encode(isset($widget['widget_data']) ? $widget['widget_data'] : [])
            ];
            
            $stmt->execute($params);
            $insertedCount++;
            error_log("Inserted new widget with widget_id: " . $widget['widget_id']);
        }
    }
    
    // Delete removed widgets if IDs are provided
    $removedCount = 0;
    if (isset($input['removed_widget_ids']) && is_array($input['removed_widget_ids'])) {
        $removedIds = $input['removed_widget_ids'];
        if (!empty($removedIds)) {
            $placeholders = implode(',', array_fill(0, count($removedIds), '?'));
            $stmt = $pdo->prepare("
                DELETE FROM user_widgets 
                WHERE user_widget_id IN ($placeholders) AND user_id = ?
            ");
            
            // Add the user ID as the last parameter
            $params = array_merge($removedIds, [$userId]);
            $stmt->execute($params);
            $removedCount = $stmt->rowCount();
            error_log("Removed " . $removedCount . " widgets");
        }
    }
    
    // Commit the transaction
    $pdo->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Widget configuration saved successfully',
        'stats' => [
            'updated' => $updatedCount,
            'inserted' => $insertedCount,
            'removed' => $removedCount
        ]
    ]);
    
} catch (PDOException $e) {
    // Rollback the transaction in case of error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Database error in save_widget.php: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Handle any other exceptions
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("General error in save_widget.php: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
}
?> 