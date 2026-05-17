<?php
/**
 * Antibiotics Endpoints
 * - GET /antibiotics - Get all antibiotics
 * - GET /antibiotics/{id} - Get single antibiotic
 */

function handleAntibiotics($conn, $method, $id) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        return;
    }

    if ($id) {
        getAntibiotic($conn, $id);
    } else {
        getAntibiotics($conn);
    }
}

function getAntibiotics($conn) {
    $category = $_GET['category'] ?? null;
    $activeOnly = $_GET['active_only'] ?? 'true';

    try {
        $sql = "SELECT * FROM antibiotics WHERE 1=1";
        $params = [];

        if ($activeOnly === 'true') {
            $sql .= " AND is_active = TRUE";
        }

        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY name ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $antibiotics = $stmt->fetchAll();

        // Get categories for filter
        $catStmt = $conn->query("SELECT DISTINCT category FROM antibiotics WHERE category IS NOT NULL ORDER BY category");
        $categories = $catStmt->fetchAll(PDO::FETCH_COLUMN);

        echo json_encode([
            'success' => true,
            'data' => $antibiotics,
            'categories' => $categories,
            'total' => count($antibiotics)
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAntibiotic($conn, $id) {
    try {
        $stmt = $conn->prepare("SELECT * FROM antibiotics WHERE antibiotic_id = ?");
        $stmt->execute([$id]);
        $antibiotic = $stmt->fetch();

        if (!$antibiotic) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Antibiotic not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => $antibiotic
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
