<?php
// This PHP script listens for the GitHub webhook and runs the bash script
// error_reporting(E_ALL);
// ini_set('display_errors', '1');

// Define a function to parse the .env file
function loadEnv($path) {
    if (! file_exists($path)) {
        throw new \Exception(".env file not found");
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Split at the first '=' to separate key and value
        list($name, $value) = explode('=', $line, 2);

        // Remove any surrounding quotes from the value
        $name = trim($name);
        $value = trim($value, '"\'');

        // Set environment variable (does not overwrite existing variables)
        if (!isset($_ENV[$name]) && !getenv($name)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load the .env file (assuming it's in the same directory as this script)
loadEnv(__DIR__ . '/../.env');

$secret = getenv('WEBHOOK_SECRET');

if (! $secret) {
    throw new \Exception("Environment variable WEBHOOK_SECRET not found!");
}

if (! isset($_SERVER['HTTP_X_HUB_SIGNATURE'])) {
    throw new \Exception("HTTP header 'X-Hub-Signature' is missing");
}

$signature = $_SERVER['HTTP_X_HUB_SIGNATURE'];

$payload = file_get_contents('php://input');
$hash = 'sha1=' . hash_hmac('sha1', $payload, $secret);

// Verify the signature matches
if (hash_equals($signature, $hash)) {
    // If signature matches, execute the bash script
    $output = [];

    exec('cd .. && ./build.sh', $output);

    echo implode("\n", $output);
}
?>