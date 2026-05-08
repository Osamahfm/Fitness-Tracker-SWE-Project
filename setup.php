<?php
/**
 * Fitness Tracker Setup Script
 * This script helps set up the database and initial configuration
 */

echo "=== Fitness Tracker Setup ===\n\n";

// Check if PHP version is adequate
if (version_compare(PHP_VERSION, '8.0.0', '<')) {
    die("Error: PHP 8.0 or higher is required. Current version: " . PHP_VERSION . "\n");
}
echo "✓ PHP version check passed: " . PHP_VERSION . "\n";

// Check database connection
try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    echo "✓ Database connection established\n";
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS fitness_tracker");
    echo "✓ Database 'fitness_tracker' created/verified\n";
    
    // Import schema
    $schemaFile = __DIR__ . '/database/schema.sql';
    if (file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        $pdo->exec("USE fitness_tracker");
        $pdo->exec($schema);
        echo "✓ Database schema imported successfully\n";
    } else {
        echo "⚠ Warning: Schema file not found at database/schema.sql\n";
    }
    
} catch (PDOException $e) {
    die("Error: Database connection failed - " . $e->getMessage() . "\n");
}

// Check required directories
$requiredDirs = ['public', 'backend', 'database'];
foreach ($requiredDirs as $dir) {
    if (!is_dir($dir)) {
        echo "⚠ Warning: Directory '$dir' not found\n";
    } else {
        echo "✓ Directory '$dir' exists\n";
    }
}

// Check required files
$requiredFiles = [
    'public/index.html',
    'public/js/app.js',
    'backend/api/auth.php',
    'backend/config/database.php'
];

foreach ($requiredFiles as $file) {
    if (!file_exists($file)) {
        echo "⚠ Warning: File '$file' not found\n";
    } else {
        echo "✓ File '$file' exists\n";
    }
}

echo "\n=== Setup Complete ===\n";
echo "To start the development server, run:\n";
echo "php -S localhost:8000 -t public\n\n";
echo "Then open your browser to: http://localhost:8000\n";
echo "Default database credentials: root (no password)\n";
?>
