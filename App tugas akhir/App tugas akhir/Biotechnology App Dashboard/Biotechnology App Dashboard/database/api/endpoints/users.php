<?php
/**
 * Users Endpoints
 * - GET /users/{id} - Get user profile
 * - PUT /users/{id} - Update user profile
 */

function handleUsers($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            getUser($conn, $id);
            break;
        case 'PUT':
            updateUser($conn, $id);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
}

function getUser($conn, $id) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        return;
    }

    try {
        $stmt = $conn->prepare("
            SELECT id, email, first_name, last_name, profile_image, phone_number,
                   is_email_verified, created_at, last_login, is_active
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }

        // Get user settings
        $settingsStmt = $conn->prepare("SELECT * FROM user_settings WHERE user_id = ?");
        $settingsStmt->execute([$id]);
        $settings = $settingsStmt->fetch();

        echo json_encode([
            'success' => true,
            'data' => [
                'user' => $user,
                'settings' => $settings
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateUser($conn, $id) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    try {
        // Check if user exists
        $checkStmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        $checkStmt->execute([$id]);
        
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }

        // Update user profile
        $updateFields = [];
        $params = [];

        $allowedFields = ['first_name', 'firstName', 'last_name', 'lastName', 
                         'phone_number', 'phoneNumber', 'profile_image', 'profileImage'];

        $fieldMap = [
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'phoneNumber' => 'phone_number',
            'profileImage' => 'profile_image'
        ];

        foreach ($data as $key => $value) {
            $dbField = $fieldMap[$key] ?? (in_array($key, $allowedFields) ? $key : null);
            if ($dbField && in_array($dbField, ['first_name', 'last_name', 'phone_number', 'profile_image'])) {
                $updateFields[] = "$dbField = ?";
                $params[] = $value;
            }
        }

        if (!empty($updateFields)) {
            $params[] = $id;
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
        }

        // Update settings if provided
        if (isset($data['settings'])) {
            $settings = $data['settings'];
            $settingsStmt = $conn->prepare("
                UPDATE user_settings 
                SET theme = COALESCE(?, theme),
                    language = COALESCE(?, language),
                    notifications_enabled = COALESCE(?, notifications_enabled)
                WHERE user_id = ?
            ");
            $settingsStmt->execute([
                $settings['theme'] ?? null,
                $settings['language'] ?? null,
                isset($settings['notifications_enabled']) ? ($settings['notifications_enabled'] ? 1 : 0) : null,
                $id
            ]);
        }

        // Fetch updated user
        $selectStmt = $conn->prepare("
            SELECT id, email, first_name, last_name, profile_image, phone_number,
                   is_email_verified, created_at, last_login, is_active
            FROM users WHERE id = ?
        ");
        $selectStmt->execute([$id]);
        $updatedUser = $selectStmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $updatedUser
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
