<?php
// Database connection settings
$host = 'localhost';
$dbname = 'seddata';
$username = 'root';
$password = '';

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>Database Connection Test</h1>";
    echo "<p>Successfully connected to the database!</p>";
    
    // Test query to get users
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Users in database:</h2>";
    echo "<ul>";
    foreach ($users as $user) {
        echo "<li>Username: {$user['username']}, Email: {$user['email']}</li>";
    }
    echo "</ul>";
    
    // Test query to get widgets
    $stmt = $pdo->query("SELECT * FROM widgets");
    $widgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Widget types in database:</h2>";
    echo "<ul>";
    foreach ($widgets as $widget) {
        echo "<li>Widget: {$widget['widget_name']} ({$widget['widget_type']})</li>";
    }
    echo "</ul>";
    
    // Test query using the dashboard_widgets view
    $stmt = $pdo->query("SELECT * FROM dashboard_widgets LIMIT 5");
    $dashboardWidgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Sample widgets from dashboard:</h2>";
    echo "<pre>";
    print_r($dashboardWidgets);
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "<h1>Database Connection Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    
    if (strpos($e->getMessage(), "Unknown database") !== false) {
        echo "<p>The database 'seddata' does not exist. Please create it and import the schema.</p>";
    }
}
?> 