<?php
// This function creates and returns a PDO connection to the MySQL database
function connectDB() {
    $host = 'localhost';      // Database server address (usually localhost for local development)
    $db   = 'seddata';        // Name of your database
    $user = 'root';           // Database username (default for XAMPP is 'root')
    $pass = '';               // Database password (default for XAMPP is empty)
    $charset = 'utf8mb4';     // Character set for the connection

    // Data Source Name string for PDO, tells PDO how to connect
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";

    // PDO options for error handling and fetch mode
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch results as associative arrays
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Use real prepared statements
    ];

    try {
        // Create and return the PDO connection
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        // If connection fails, throw an exception with the error message
        throw new PDOException($e->getMessage(), (int)$e->getCode());
    }
}
?>