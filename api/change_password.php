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
    if (empty($data['current_password']) || empty($data['new_password'])) {
        throw new Exception('Current password and new password are required');
    }
    
    // Get the user ID from the session
    $userId = $_SESSION['user_id'];
    
    // Connect to database
    $conn = connectDB();
    
    // Get the current password hash from the database
    $sql = "SELECT wachtwoord FROM gebruiker WHERE id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found');
    }
    
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $currentPasswordHash = $row['wachtwoord'];
    
    // Verify the current password
    if (!password_verify($data['current_password'], $currentPasswordHash)) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }
    
    // Hash the new password
    $newPasswordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
    
    // Update the password in the database
    $updateSql = "UPDATE gebruiker SET wachtwoord = :password WHERE id = :user_id";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bindParam(':password', $newPasswordHash, PDO::PARAM_STR);
    $updateStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $updateStmt->execute();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Password updated successfully'
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