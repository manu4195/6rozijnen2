<?php
// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
}

// Set content type to JSON
header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Please use POST.']);
    exit;
}

// Include database connection
require_once '../login/config/database.php';

try {
    // Get JSON data from request
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);
    
    // Validate data
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data provided');
    }
    
    // Check required fields
    if (empty($data['username'])) {
        throw new Exception('Username is required');
    }
    
    // Get the user ID from the session
    $userId = $_SESSION['user_id'];
    
    // Connect to database
    $conn = connectDB();
    
    // Check if the username is already taken by another user
    $checkSql = "SELECT id FROM gebruiker WHERE naam = :username AND id != :user_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':username', $data['username'], PDO::PARAM_STR);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Username is already taken']);
        exit;
    }
    
    // Update the username in the database
    $updateSql = "UPDATE gebruiker SET naam = :username WHERE id = :user_id";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bindParam(':username', $data['username'], PDO::PARAM_STR);
    $updateStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $updateStmt->execute();
    
    // Update the session
    $_SESSION['username'] = $data['username'];
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
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