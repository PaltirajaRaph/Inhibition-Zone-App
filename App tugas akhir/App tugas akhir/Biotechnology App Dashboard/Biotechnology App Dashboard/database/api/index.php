<?php
/**
 * API Endpoints - Biotechnology Dashboard
 * Main entry point for all API requests
 * 
 * Setup:
 * 1. Copy 'api' folder to: C:\xampp\htdocs\biotech-api\
 * 2. Access via: http://localhost/biotech-api/
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, bypass-tunnel-reminder');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config/database.php';

// Get request info
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$path = str_replace('/biotech-api/', '', $path);
$segments = explode('/', trim($path, '/'));

$endpoint = $segments[0] ?? '';
$id = $segments[1] ?? null;

// Database connection
$database = new Database();
$conn = $database->getConnection();

// Route to appropriate handler (organization-only API)
switch ($endpoint) {
    case 'auth':
        require_once 'endpoints/auth.php';
        handleAuth($conn, $method, $segments[1] ?? '');
        break;
    case 'analyses':
        require_once 'endpoints/analyses.php';
        handleAnalyses($conn, $method, $segments[1] ?? null);
        break;
    case 'antibiotics':
        require_once 'endpoints/antibiotics.php';
        handleAntibiotics($conn, $method, $segments[1] ?? null);
        break;
    case 'statistics':
        require_once 'endpoints/statistics.php';
        handleStatistics($conn, $method, $segments[1] ?? null);
        break;
        
    case '':
    case 'health':
        echo json_encode([
            'success' => true,
            'message' => 'Biotechnology Dashboard API is running',
            'version' => '2.0.0',
            'mode' => 'organization-only',
            'endpoints' => [
                'POST /auth/register-organization' => 'Register organization with admin and members',
                'POST /auth/admin-login' => 'Admin login',
                'POST /auth/member-login' => 'Member login',
                'POST /auth/check-account' => 'Check username availability',
                'POST /auth/account-control-login' => 'Control login',
                'POST /auth/account-control-list' => 'List active accounts',
                'POST /auth/account-control-create-account' => 'Create admin/member account in organization',
                'POST /auth/account-control-update-organization' => 'Rename organization',
                'POST /auth/account-control-delete-organization' => 'Delete organization',
                'POST /auth/account-control-update-team' => 'Rename team',
                'POST /auth/account-control-delete-team' => 'Delete team',
                'POST /auth/account-control-delete' => 'Delete account',
                'POST /auth/account-control-update-password' => 'Update account password',
                'POST /auth/account-control-update-credentials' => 'Update control credentials',
                'POST /auth/account-self-update' => 'Self update username/password'
            ]
        ]);
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found'
        ]);
}
