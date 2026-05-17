<?php
/**
 * Authentication Endpoints
 * - POST /auth/register-organization
 * - POST /auth/admin-login
 * - POST /auth/member-login
 * - POST /auth/check-account
 * - POST /auth/account-control-login
 * - POST /auth/account-control-list
 * - POST /auth/account-control-create-account
 * - POST /auth/account-control-update-organization
 * - POST /auth/account-control-delete-organization
 * - POST /auth/account-control-update-team
 * - POST /auth/account-control-delete-team
 * - POST /auth/account-control-delete
 * - POST /auth/account-control-update-password
 * - POST /auth/account-control-update-credentials
 * - POST /auth/account-self-update
 */

function handleAuth($conn, $method, $action) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'login':
        case 'register':
            http_response_code(410);
            echo json_encode([
                'success' => false,
                'message' => 'Legacy user auth is disabled in organization-only mode'
            ]);
            break;
        case 'register-organization':
            registerOrganization($conn, $data);
            break;
        case 'admin-login':
            adminLogin($conn, $data);
            break;
        case 'member-login':
            memberLogin($conn, $data);
            break;
        case 'check-account':
            checkAccount($conn, $data);
            break;
        case 'account-control-login':
            accountControlLogin($conn, $data);
            break;
        case 'account-control-list':
            accountControlList($conn, $data);
            break;
        case 'account-control-create-account':
            accountControlCreateAccount($conn, $data);
            break;
        case 'account-control-update-organization':
            accountControlUpdateOrganization($conn, $data);
            break;
        case 'account-control-delete-organization':
            accountControlDeleteOrganization($conn, $data);
            break;
        case 'account-control-update-team':
            accountControlUpdateTeam($conn, $data);
            break;
        case 'account-control-delete-team':
            accountControlDeleteTeam($conn, $data);
            break;
        case 'account-control-delete':
            accountControlDelete($conn, $data);
            break;
        case 'account-control-update-password':
            accountControlUpdatePassword($conn, $data);
            break;
        case 'account-control-update-credentials':
            accountControlUpdateCredentials($conn, $data);
            break;
        case 'account-self-update':
            accountSelfUpdate($conn, $data);
            break;
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Action not found']);
    }
}

function usernameExists($conn, $username, &$accountType = null) {
    $username = trim($username);
    if ($username === '') {
        $accountType = null;
        return false;
    }

    $adminStmt = $conn->prepare("SELECT id FROM organization_admins WHERE username = ? AND is_active = TRUE LIMIT 1");
    $adminStmt->execute([$username]);
    if ($adminStmt->fetch()) {
        $accountType = 'admin';
        return true;
    }

    $memberStmt = $conn->prepare("SELECT id FROM organization_members WHERE username = ? AND is_active = TRUE LIMIT 1");
    $memberStmt->execute([$username]);
    if ($memberStmt->fetch()) {
        $accountType = 'member';
        return true;
    }

    $accountType = null;
    return false;
}

function generateCompactEntityId($conn, $table, $prefix, $randomLength = 8) {
    $allowedTables = ['organizations', 'organization_admins', 'organization_teams', 'organization_members'];
    if (!in_array($table, $allowedTables, true)) {
        throw new InvalidArgumentException('Invalid table for ID generation');
    }

    $length = max(6, min(12, intval($randomLength)));
    $stmt = $conn->prepare("SELECT id FROM {$table} WHERE id = ? LIMIT 1");

    for ($attempt = 0; $attempt < 20; $attempt += 1) {
        $suffix = strtoupper(substr(bin2hex(random_bytes(8)), 0, $length));
        $candidate = $prefix . $suffix;

        $stmt->execute([$candidate]);
        if (!$stmt->fetch()) {
            return $candidate;
        }
    }

    return $prefix . strtoupper(substr(bin2hex(random_bytes(10)), 0, $length + 2));
}

function login($conn, $data) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password required']);
        return;
    }

    try {
        $stmt = $conn->prepare("
            SELECT id, email, password, first_name, last_name, profile_image, is_active
            FROM users 
            WHERE email = ? AND is_active = TRUE
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'User not found or inactive']);
            return;
        }

        // Verify password
        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
            return;
        }

        // Update last login
        $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$user['id']]);

        // Create session
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
        
        $sessionStmt = $conn->prepare("
            INSERT INTO sessions (session_id, user_id, device_info, ip_address, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ");
        $sessionStmt->execute([
            $sessionId,
            $user['id'],
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            $expiresAt
        ]);

        // Remove password from response
        unset($user['password']);

        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'session_id' => $sessionId,
                'expires_at' => $expiresAt
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function register($conn, $data) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $firstName = $data['first_name'] ?? $data['firstName'] ?? '';
    $lastName = $data['last_name'] ?? $data['lastName'] ?? '';

    // Validation
    if (empty($email) || empty($password) || empty($firstName) || empty($lastName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        return;
    }

    try {
        // Check if email exists
        $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $checkStmt->execute([$email]);
        
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already registered']);
            return;
        }

        // Create user
        $userId = 'user_' . bin2hex(random_bytes(8));
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $conn->prepare("
            INSERT INTO users (id, email, password, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $email, $hashedPassword, $firstName, $lastName]);

        // Create default settings
        $settingsStmt = $conn->prepare("
            INSERT INTO user_settings (id, user_id)
            VALUES (?, ?)
        ");
        $settingsStmt->execute(['settings_' . bin2hex(random_bytes(8)), $userId]);

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user_id' => $userId,
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Check whether account username already exists
 * Expected data: { "username": "string", "type": "admin"|"member" }
 */
function checkAccount($conn, $data) {
    $username = trim($data['username'] ?? '');
    $type = strtolower(trim($data['type'] ?? ''));

    if (empty($username)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username is required']);
        return;
    }

    try {
        $exists = false;
        $accountType = null;

        if ($type === 'admin') {
            $stmt = $conn->prepare("SELECT id FROM organization_admins WHERE username = ? AND is_active = TRUE LIMIT 1");
            $stmt->execute([$username]);
            $exists = (bool)$stmt->fetch();
            $accountType = $exists ? 'admin' : null;
        } else if ($type === 'member') {
            $stmt = $conn->prepare("SELECT id FROM organization_members WHERE username = ? AND is_active = TRUE LIMIT 1");
            $stmt->execute([$username]);
            $exists = (bool)$stmt->fetch();
            $accountType = $exists ? 'member' : null;
        } else {
            $exists = usernameExists($conn, $username, $accountType);
        }

        echo json_encode([
            'success' => true,
            'exists' => $exists,
            'account_type' => $accountType,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Register a new organization with admin and members
 * Expected data:
 * {
 *   "organization_name": "string",
 *   "admin": { "username": "string", "password": "string" },
 *   "teams": ["string"],
 *   "members": [{ "username": "string", "password": "string", "team": "string" }]
 * }
 */
function registerOrganization($conn, $data) {
    $organizationName = trim($data['organization_name'] ?? '');
    $admin = $data['admin'] ?? null;
    $teams = $data['teams'] ?? [];
    $members = $data['members'] ?? [];

    if (empty($organizationName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Organization name is required']);
        return;
    }

    if (!$admin || empty(trim($admin['username'] ?? '')) || empty($admin['password'] ?? '')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Admin username and password are required']);
        return;
    }

    if (!is_array($teams) || count($teams) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'At least one team is required']);
        return;
    }

    if (!is_array($members) || count($members) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'At least one member is required']);
        return;
    }

    try {
        $orgCheck = $conn->prepare("SELECT id FROM organizations WHERE LOWER(name) = LOWER(?) AND is_active = TRUE LIMIT 1");
        $orgCheck->execute([$organizationName]);
        if ($orgCheck->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Organization name already exists']);
            return;
        }

        $adminUsername = trim($admin['username']);
        $existingType = null;
        if (usernameExists($conn, $adminUsername, $existingType)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Admin account already exists']);
            return;
        }

        $seenMembers = [];
        foreach ($members as $member) {
            $memberUsername = trim($member['username'] ?? '');
            if ($memberUsername === '') {
                continue;
            }

            $lowerUsername = strtolower($memberUsername);
            if (isset($seenMembers[$lowerUsername])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Duplicate member username in request']);
                return;
            }
            $seenMembers[$lowerUsername] = true;

            if ($lowerUsername === strtolower($adminUsername)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Admin and member username cannot be the same']);
                return;
            }

            $memberType = null;
            if (usernameExists($conn, $memberUsername, $memberType)) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Member account already exists']);
                return;
            }
        }

        $conn->beginTransaction();

        $orgId = generateCompactEntityId($conn, 'organizations', 'ORG_');
        $insertOrg = $conn->prepare("INSERT INTO organizations (id, name) VALUES (?, ?)");
        $insertOrg->execute([$orgId, $organizationName]);

        $adminId = generateCompactEntityId($conn, 'organization_admins', 'ADM_');
        $hashedAdminPassword = password_hash($admin['password'], PASSWORD_BCRYPT);
        $insertAdmin = $conn->prepare("INSERT INTO organization_admins (id, organization_id, username, password) VALUES (?, ?, ?, ?)");
        $insertAdmin->execute([$adminId, $orgId, $adminUsername, $hashedAdminPassword]);

        $teamIds = [];
        foreach ($teams as $teamNameRaw) {
            $teamName = trim($teamNameRaw);
            if ($teamName === '') {
                continue;
            }

            $teamId = generateCompactEntityId($conn, 'organization_teams', 'TEAM_');
            $insertTeam = $conn->prepare("INSERT INTO organization_teams (id, organization_id, name) VALUES (?, ?, ?)");
            $insertTeam->execute([$teamId, $orgId, $teamName]);
            $teamIds[$teamName] = $teamId;
        }

        foreach ($members as $member) {
            $memberUsername = trim($member['username'] ?? '');
            $memberPassword = $member['password'] ?? '';
            $memberTeam = trim($member['team'] ?? '');

            if ($memberUsername === '' || $memberPassword === '' || $memberTeam === '') {
                continue;
            }

            $teamId = $teamIds[$memberTeam] ?? null;
            if (!$teamId) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid team: ' . $memberTeam]);
                return;
            }

            $memberId = generateCompactEntityId($conn, 'organization_members', 'MEM_');
            $hashedMemberPassword = password_hash($memberPassword, PASSWORD_BCRYPT);

            $insertMember = $conn->prepare("INSERT INTO organization_members (id, organization_id, team_id, username, password) VALUES (?, ?, ?, ?, ?)");
            $insertMember->execute([$memberId, $orgId, $teamId, $memberUsername, $hashedMemberPassword]);
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Organization registered successfully',
            'data' => [
                'organization_id' => $orgId,
                'organization_name' => $organizationName,
                'admin_id' => $adminId,
                'teams_count' => count($teams),
                'members_count' => count($members),
            ],
        ]);
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        $message = $e->getMessage();
        if (stripos($message, 'unique_org_admin') !== false || stripos($message, 'unique_admin_username') !== false) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Admin account already exists']);
            return;
        }
        if (stripos($message, 'unique_org_member') !== false || stripos($message, 'unique_member_username') !== false) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Member account already exists']);
            return;
        }

        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $message]);
    }
}

/**
 * Admin login
 * Expected data: { "username": "string", "password": "string" }
 */
function adminLogin($conn, $data) {
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        return;
    }

    try {
        $stmt = $conn->prepare("\n            SELECT a.id, a.organization_id, a.username, a.password, a.is_active, o.name as organization_name\n            FROM organization_admins a\n            JOIN organizations o ON a.organization_id = o.id\n            WHERE a.username = ? AND a.is_active = TRUE AND o.is_active = TRUE\n        ");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if (!$admin) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Admin account not found or inactive']);
            return;
        }

        if (!password_verify($password, $admin['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
            return;
        }

        $updateStmt = $conn->prepare("UPDATE organization_admins SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$admin['id']]);

        $teamsStmt = $conn->prepare("SELECT id, name FROM organization_teams WHERE organization_id = ?");
        $teamsStmt->execute([$admin['organization_id']]);
        $teams = $teamsStmt->fetchAll();

        $membersStmt = $conn->prepare("\n            SELECT m.id, m.username, t.name as team_name\n            FROM organization_members m\n            JOIN organization_teams t ON m.team_id = t.id\n            WHERE m.organization_id = ? AND m.is_active = TRUE\n        ");
        $membersStmt->execute([$admin['organization_id']]);
        $members = $membersStmt->fetchAll();

        unset($admin['password']);

        echo json_encode([
            'success' => true,
            'message' => 'Admin login successful',
            'data' => [
                'admin' => $admin,
                'teams' => $teams,
                'members' => $members,
            ],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Member login
 * Expected data: { "username": "string", "password": "string" }
 */
function memberLogin($conn, $data) {
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        return;
    }

    try {
        $stmt = $conn->prepare("\n            SELECT m.id, m.organization_id, m.team_id, m.username, m.password, m.is_active,\n                   o.name as organization_name, t.name as team_name\n            FROM organization_members m\n            JOIN organizations o ON m.organization_id = o.id\n            JOIN organization_teams t ON m.team_id = t.id\n            WHERE m.username = ? AND m.is_active = TRUE AND o.is_active = TRUE\n        ");
        $stmt->execute([$username]);
        $member = $stmt->fetch();

        if (!$member) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Member account not found or inactive']);
            return;
        }

        if (!password_verify($password, $member['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
            return;
        }

        $updateStmt = $conn->prepare("UPDATE organization_members SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$member['id']]);

        unset($member['password']);

        echo json_encode([
            'success' => true,
            'message' => 'Member login successful',
            'data' => [
                'member' => $member,
            ],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAccountControlConfig($conn) {
    $username = getenv('BIOTECH_CONTROL_USERNAME');
    $password = getenv('BIOTECH_CONTROL_PASSWORD');
    $secret = getenv('BIOTECH_CONTROL_TOKEN_SECRET');

    if ($username === false || trim($username) === '') {
        $username = 'control';
    }
    if ($password === false || trim($password) === '') {
        $password = 'control123';
    }
    if ($secret === false || trim($secret) === '') {
        $secret = 'biotech-control-secret-2026';
    }

    $fallbackUsername = trim((string)$username);
    $fallbackPasswordHash = password_hash((string)$password, PASSWORD_BCRYPT);
    $fallbackSecret = trim((string)$secret);

    try {
        $stmt = $conn->prepare('SELECT username, password_hash, token_secret FROM account_control_credentials WHERE id = 1 LIMIT 1');
        $stmt->execute();
        $row = $stmt->fetch();

        if (is_array($row)) {
            $storedUsername = trim((string)($row['username'] ?? ''));
            $storedPasswordHash = (string)($row['password_hash'] ?? '');
            $storedSecret = trim((string)($row['token_secret'] ?? ''));

            if ($storedUsername !== '' && $storedPasswordHash !== '' && $storedSecret !== '') {
                return [$storedUsername, $storedPasswordHash, $storedSecret];
            }
        }

        // Table exists but no usable data yet; initialize from ENV/default.
        $initialized = saveAccountControlConfig($conn, $fallbackUsername, $fallbackPasswordHash, $fallbackSecret);
        if (!$initialized) {
            throw new Exception('Failed to initialize account control credentials');
        }

        return [$fallbackUsername, $fallbackPasswordHash, $fallbackSecret];
    } catch (Throwable $e) {
        throw new Exception('Account control credentials DB error: ' . $e->getMessage(), 0, $e);
    }
}

function saveAccountControlConfig($conn, $username, $passwordHash, $secret) {
    $username = trim((string)$username);
    $passwordHash = (string)$passwordHash;
    $secret = trim((string)$secret);

    if ($username === '' || $passwordHash === '' || $secret === '') {
        return false;
    }

    try {
        $stmt = $conn->prepare(
            'INSERT INTO account_control_credentials (id, username, password_hash, token_secret, created_at, updated_at) '
            . 'VALUES (1, ?, ?, ?, NOW(), NOW()) '
            . 'ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), token_secret = VALUES(token_secret), updated_at = NOW()'
        );
        return $stmt->execute([$username, $passwordHash, $secret]);
    } catch (Throwable $e) {
        return false;
    }
}

function base64UrlEncode($value) {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64UrlDecode($value) {
    $padding = 4 - (strlen($value) % 4);
    if ($padding < 4) {
        $value .= str_repeat('=', $padding);
    }
    return base64_decode(strtr($value, '-_', '+/'));
}

function issueAccountControlToken($username, $secret) {
    $payload = [
        'u' => $username,
        'exp' => time() + (2 * 60 * 60),
    ];

    $encodedPayload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', $encodedPayload, $secret);

    return [
        'token' => $encodedPayload . '.' . $signature,
        'expires_at' => $payload['exp'],
    ];
}

function validateAccountControlToken($token, $secret, &$payload = null) {
    if (!is_string($token) || trim($token) === '') {
        return false;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return false;
    }

    [$encodedPayload, $providedSignature] = $parts;
    $expectedSignature = hash_hmac('sha256', $encodedPayload, $secret);
    if (!hash_equals($expectedSignature, $providedSignature)) {
        return false;
    }

    $decoded = base64UrlDecode($encodedPayload);
    if ($decoded === false) {
        return false;
    }

    $parsed = json_decode($decoded, true);
    if (!is_array($parsed) || !isset($parsed['exp']) || time() > (int)$parsed['exp']) {
        return false;
    }

    $payload = $parsed;
    return true;
}

function accountControlLogin($conn, $data) {
    try {
        [$controlUsername, $controlPasswordHash, $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }

    $username = trim($data['username'] ?? '');
    $password = (string)($data['password'] ?? '');

    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        return;
    }

    if (!hash_equals($controlUsername, $username) || !password_verify($password, $controlPasswordHash)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Control credentials are invalid']);
        return;
    }

    $tokenData = issueAccountControlToken($username, $secret);

    echo json_encode([
        'success' => true,
        'message' => 'Control login successful',
        'data' => $tokenData,
    ]);
}

function accountControlList($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    try {
        $adminStmt = $conn->prepare("\n            SELECT a.id, a.username, a.last_login, o.name AS organization_name\n            FROM organization_admins a\n            JOIN organizations o ON a.organization_id = o.id\n            WHERE a.is_active = TRUE AND o.is_active = TRUE\n            ORDER BY o.name ASC, a.username ASC\n        ");
        $adminStmt->execute();
        $admins = $adminStmt->fetchAll();

        $memberStmt = $conn->prepare("\n            SELECT m.id, m.username, m.last_login, o.name AS organization_name, t.name AS team_name\n            FROM organization_members m\n            JOIN organizations o ON m.organization_id = o.id\n            JOIN organization_teams t ON m.team_id = t.id\n            WHERE m.is_active = TRUE AND o.is_active = TRUE\n            ORDER BY o.name ASC, t.name ASC, m.username ASC\n        ");
        $memberStmt->execute();
        $members = $memberStmt->fetchAll();

        $organizationStmt = $conn->prepare("\n            SELECT o.id AS organization_id, o.name AS organization_name, t.id AS team_id, t.name AS team_name\n            FROM organizations o\n            LEFT JOIN organization_teams t ON t.organization_id = o.id\n            WHERE o.is_active = TRUE\n            ORDER BY o.name ASC, t.name ASC\n        ");
        $organizationStmt->execute();
        $organizationRows = $organizationStmt->fetchAll();

        $organizationsById = [];
        foreach ($organizationRows as $row) {
            $organizationId = (string)($row['organization_id'] ?? '');
            if ($organizationId === '') {
                continue;
            }

            if (!isset($organizationsById[$organizationId])) {
                $organizationsById[$organizationId] = [
                    'id' => $organizationId,
                    'name' => (string)($row['organization_name'] ?? ''),
                    'teams' => [],
                ];
            }

            $teamId = (string)($row['team_id'] ?? '');
            if ($teamId !== '') {
                $organizationsById[$organizationId]['teams'][] = [
                    'id' => $teamId,
                    'name' => (string)($row['team_name'] ?? ''),
                ];
            }
        }

        $organizations = array_values($organizationsById);

        echo json_encode([
            'success' => true,
            'message' => 'Account list loaded',
            'data' => [
                'admins' => $admins,
                'members' => $members,
                'organizations' => $organizations,
            ],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlCreateAccount($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $type = strtolower(trim((string)($data['type'] ?? '')));
    $organizationId = trim((string)($data['organization_id'] ?? ''));
    $teamId = trim((string)($data['team_id'] ?? ''));
    $username = trim((string)($data['username'] ?? ''));
    $password = (string)($data['password'] ?? '');

    if (($type !== 'admin' && $type !== 'member') || $organizationId === '' || $username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'type, organization_id, username, and password are required']);
        return;
    }

    if ($type === 'member' && $teamId === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'team_id is required for member']);
        return;
    }

    if (strlen($username) < 3) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username must be at least 3 characters']);
        return;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        return;
    }

    try {
        $orgStmt = $conn->prepare("SELECT id FROM organizations WHERE id = ? AND is_active = TRUE LIMIT 1");
        $orgStmt->execute([$organizationId]);
        if (!$orgStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Organization not found']);
            return;
        }

        $existingType = null;
        if (usernameExists($conn, $username, $existingType)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
            return;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        if ($type === 'admin') {
            $accountId = generateCompactEntityId($conn, 'organization_admins', 'ADM_');
            $insertStmt = $conn->prepare("INSERT INTO organization_admins (id, organization_id, username, password) VALUES (?, ?, ?, ?)");
            $insertStmt->execute([$accountId, $organizationId, $username, $hashedPassword]);
        } else {
            $teamStmt = $conn->prepare("SELECT id FROM organization_teams WHERE id = ? AND organization_id = ? LIMIT 1");
            $teamStmt->execute([$teamId, $organizationId]);
            if (!$teamStmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Team not found in organization']);
                return;
            }

            $accountId = generateCompactEntityId($conn, 'organization_members', 'MEM_');
            $insertStmt = $conn->prepare("INSERT INTO organization_members (id, organization_id, team_id, username, password) VALUES (?, ?, ?, ?, ?)");
            $insertStmt->execute([$accountId, $organizationId, $teamId, $username, $hashedPassword]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Account created successfully',
            'data' => [
                'id' => $accountId,
                'type' => $type,
            ],
        ]);
    } catch (PDOException $e) {
        if (
            stripos($e->getMessage(), 'unique_org_admin') !== false
            || stripos($e->getMessage(), 'unique_org_member') !== false
            || stripos($e->getMessage(), 'unique_admin_username') !== false
            || stripos($e->getMessage(), 'unique_member_username') !== false
        ) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
            return;
        }

        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlUpdateOrganization($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $organizationId = trim((string)($data['organization_id'] ?? ''));
    $newName = trim((string)($data['new_name'] ?? ''));

    if ($organizationId === '' || $newName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'organization_id and new_name are required']);
        return;
    }

    try {
        $findStmt = $conn->prepare("SELECT id, name FROM organizations WHERE id = ? AND is_active = TRUE LIMIT 1");
        $findStmt->execute([$organizationId]);
        $organization = $findStmt->fetch();

        if (!$organization) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Organization not found']);
            return;
        }

        if (strcasecmp(trim((string)$organization['name']), $newName) === 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Organization name updated',
                'data' => ['organization_id' => $organizationId],
            ]);
            return;
        }

        $duplicateStmt = $conn->prepare("SELECT id FROM organizations WHERE LOWER(name) = LOWER(?) AND id <> ? AND is_active = TRUE LIMIT 1");
        $duplicateStmt->execute([$newName, $organizationId]);
        if ($duplicateStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Organization name already exists']);
            return;
        }

        $updateStmt = $conn->prepare("UPDATE organizations SET name = ? WHERE id = ? AND is_active = TRUE");
        $updateStmt->execute([$newName, $organizationId]);

        if ($updateStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Organization not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Organization name updated',
            'data' => ['organization_id' => $organizationId],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlDeleteOrganization($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $organizationId = trim((string)($data['organization_id'] ?? ''));
    if ($organizationId === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'organization_id is required']);
        return;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM organizations WHERE id = ?");
        $stmt->execute([$organizationId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Organization not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Organization deleted successfully',
            'data' => ['organization_id' => $organizationId],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlUpdateTeam($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $teamId = trim((string)($data['team_id'] ?? ''));
    $newName = trim((string)($data['new_name'] ?? ''));

    if ($teamId === '' || $newName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'team_id and new_name are required']);
        return;
    }

    try {
        $findStmt = $conn->prepare("SELECT id, organization_id, name FROM organization_teams WHERE id = ? LIMIT 1");
        $findStmt->execute([$teamId]);
        $team = $findStmt->fetch();

        if (!$team) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Team not found']);
            return;
        }

        if (strcasecmp(trim((string)$team['name']), $newName) === 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Team name updated',
                'data' => ['team_id' => $teamId],
            ]);
            return;
        }

        $duplicateStmt = $conn->prepare("SELECT id FROM organization_teams WHERE organization_id = ? AND LOWER(name) = LOWER(?) AND id <> ? LIMIT 1");
        $duplicateStmt->execute([(string)$team['organization_id'], $newName, $teamId]);
        if ($duplicateStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Team name already exists in organization']);
            return;
        }

        $updateStmt = $conn->prepare("UPDATE organization_teams SET name = ? WHERE id = ?");
        $updateStmt->execute([$newName, $teamId]);

        if ($updateStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Team not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Team name updated',
            'data' => ['team_id' => $teamId],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlDeleteTeam($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $teamId = trim((string)($data['team_id'] ?? ''));
    if ($teamId === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'team_id is required']);
        return;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM organization_teams WHERE id = ?");
        $stmt->execute([$teamId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Team not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Team deleted successfully',
            'data' => ['team_id' => $teamId],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlDelete($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $type = strtolower(trim($data['type'] ?? ''));
    $accountId = trim($data['account_id'] ?? '');

    if ($accountId === '' || ($type !== 'admin' && $type !== 'member')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'type and account_id are required']);
        return;
    }

    try {
        if ($type === 'admin') {
            $stmt = $conn->prepare("DELETE FROM organization_admins WHERE id = ?");
        } else {
            $stmt = $conn->prepare("DELETE FROM organization_members WHERE id = ?");
        }

        $stmt->execute([$accountId]);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Account not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Account deleted successfully',
            'data' => [
                'type' => $type,
                'account_id' => $accountId,
            ],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlUpdatePassword($conn, $data) {
    try {
        [, , $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $type = strtolower(trim($data['type'] ?? ''));
    $accountId = trim($data['account_id'] ?? '');
    $newPassword = (string)($data['new_password'] ?? '');

    if ($accountId === '' || ($type !== 'admin' && $type !== 'member')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'type and account_id are required']);
        return;
    }

    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        return;
    }

    try {
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

        if ($type === 'admin') {
            $stmt = $conn->prepare("UPDATE organization_admins SET password = ? WHERE id = ? AND is_active = TRUE");
            $stmt->execute([$hashedPassword, $accountId]);
        } else {
            $stmt = $conn->prepare("UPDATE organization_members SET password = ? WHERE id = ? AND is_active = TRUE");
            $stmt->execute([$hashedPassword, $accountId]);
        }

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Account not found or inactive']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Password updated successfully',
            'data' => [
                'type' => $type,
                'account_id' => $accountId,
            ],
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function accountControlUpdateCredentials($conn, $data) {
    try {
        [$controlUsername, $controlPasswordHash, $secret] = getAccountControlConfig($conn);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }
    $token = $data['token'] ?? '';

    if (!validateAccountControlToken($token, $secret, $payload)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired control token']);
        return;
    }

    $payloadUsername = trim((string)($payload['u'] ?? ''));
    if ($payloadUsername === '' || !hash_equals($controlUsername, $payloadUsername)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid control session']);
        return;
    }

    $currentPassword = (string)($data['current_password'] ?? '');
    $newUsername = trim((string)($data['new_username'] ?? ''));
    $newPassword = (string)($data['new_password'] ?? '');

    if ($currentPassword === '' || $newUsername === '' || $newPassword === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'current_password, new_username, and new_password are required']);
        return;
    }

    if (strlen($newUsername) < 3) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username must be at least 3 characters']);
        return;
    }

    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        return;
    }

    if (!password_verify($currentPassword, $controlPasswordHash)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Current password is invalid']);
        return;
    }

    $nextPasswordHash = password_hash($newPassword, PASSWORD_BCRYPT);
    if (!saveAccountControlConfig($conn, $newUsername, $nextPasswordHash, $secret)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to persist control credentials']);
        return;
    }

    $tokenData = issueAccountControlToken($newUsername, $secret);

    echo json_encode([
        'success' => true,
        'message' => 'Control credentials updated successfully',
        'data' => [
            'username' => $newUsername,
            'token' => $tokenData['token'],
            'expires_at' => $tokenData['expires_at'],
        ],
    ]);
}

function accountSelfUpdate($conn, $data) {
    $role = strtolower(trim($data['role'] ?? ''));
    $currentUsername = trim((string)($data['current_username'] ?? ''));
    $currentPassword = (string)($data['current_password'] ?? '');
    $newUsername = trim((string)($data['new_username'] ?? ''));
    $newPassword = null;
    if (array_key_exists('new_password', (array)$data)) {
        $newPassword = trim((string)($data['new_password'] ?? ''));
        if ($newPassword === '') {
            $newPassword = null;
        }
    }

    if (($role !== 'admin' && $role !== 'member') || $currentUsername === '' || $currentPassword === '' || $newUsername === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'role, current_username, current_password, and new_username are required']);
        return;
    }

    if (strlen($newUsername) < 3) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username must be at least 3 characters']);
        return;
    }

    if ($newPassword !== null && strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        return;
    }

    try {
        if ($role === 'admin') {
            $findStmt = $conn->prepare("SELECT id, username, password FROM organization_admins WHERE username = ? AND is_active = TRUE LIMIT 1");
        } else {
            $findStmt = $conn->prepare("SELECT id, username, password FROM organization_members WHERE username = ? AND is_active = TRUE LIMIT 1");
        }

        $findStmt->execute([$currentUsername]);
        $account = $findStmt->fetch();

        if (!$account) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Account not found or inactive']);
            return;
        }

        if (!password_verify($currentPassword, $account['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Current password is invalid']);
            return;
        }

        if (strcasecmp($currentUsername, $newUsername) !== 0) {
            $existingType = null;
            if (usernameExists($conn, $newUsername, $existingType)) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Username already exists']);
                return;
            }
        }

        if ($newPassword !== null) {
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            if ($role === 'admin') {
                $updateStmt = $conn->prepare("UPDATE organization_admins SET username = ?, password = ? WHERE id = ? AND is_active = TRUE");
            } else {
                $updateStmt = $conn->prepare("UPDATE organization_members SET username = ?, password = ? WHERE id = ? AND is_active = TRUE");
            }

            $updateStmt->execute([$newUsername, $hashedPassword, $account['id']]);
        } else {
            if ($role === 'admin') {
                $updateStmt = $conn->prepare("UPDATE organization_admins SET username = ? WHERE id = ? AND is_active = TRUE");
            } else {
                $updateStmt = $conn->prepare("UPDATE organization_members SET username = ? WHERE id = ? AND is_active = TRUE");
            }

            $updateStmt->execute([$newUsername, $account['id']]);
        }
        if ($updateStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Account not found or inactive']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Account credentials updated successfully',
            'data' => [
                'role' => $role,
                'username' => $newUsername,
            ],
        ]);
    } catch (PDOException $e) {
        if (
            stripos($e->getMessage(), 'unique_org_admin') !== false
            || stripos($e->getMessage(), 'unique_org_member') !== false
            || stripos($e->getMessage(), 'unique_admin_username') !== false
            || stripos($e->getMessage(), 'unique_member_username') !== false
        ) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
            return;
        }

        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
