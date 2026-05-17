<?php
/**
 * Analyses Endpoints
 * - GET /analyses?member_id=xxx - Get member analyses
 * - GET /analyses?organization_id=xxx - Get organization analyses
 * - GET /analyses/{id} - Get single analysis
 * - POST /analyses - Create new analysis
 * - PUT /analyses/{id} - Update analysis
 * - DELETE /analyses/{id} - Delete analysis
 */

function handleAnalyses($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                getAnalysis($conn, $id);
            } else {
                getAnalyses($conn);
            }
            break;
        case 'POST':
            createAnalysis($conn);
            break;
        case 'PUT':
            updateAnalysis($conn, $id);
            break;
        case 'DELETE':
            deleteAnalysis($conn, $id);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
}

function generateShortAnalysisId($conn) {
    $checkStmt = $conn->prepare("SELECT id FROM analyses WHERE id = ? LIMIT 1");

    for ($attempt = 0; $attempt < 8; $attempt += 1) {
        $candidate = 'AN_' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $checkStmt->execute([$candidate]);
        if (!$checkStmt->fetch()) {
            return $candidate;
        }
    }

    return 'AN_' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
}

function normalizeAnalysisStatusValue($value) {
    $normalized = strtolower(trim((string) ($value ?? '')));
    if ($normalized === 'complete' || $normalized === 'completed' || $normalized === 'selesai') {
        return 'completed';
    }
    if ($normalized === 'failed' || $normalized === 'gagal') {
        return 'failed';
    }
    if ($normalized === 'processing') {
        return 'processing';
    }
    if ($normalized === 'archived') {
        return 'archived';
    }
    return 'pending';
}

function normalizeResultValue($value) {
    $normalized = strtolower(trim((string) ($value ?? '')));
    if ($normalized === 'resisten' || $normalized === 'resistant') return 'resistant';
    if ($normalized === 'rentan' || $normalized === 'susceptible') return 'susceptible';
    if ($normalized === 'intermediat' || $normalized === 'intermediate') return 'intermediate';
    if ($normalized === 'indeterminate') return 'indeterminate';
    return null;
}

function getAnalysisColumnMap($conn) {
    static $columns = null;
    if ($columns !== null) {
        return $columns;
    }

    $columns = [];
    try {
        $stmt = $conn->query("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'analyses'");
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $column) {
            $columns[$column] = true;
        }
    } catch (PDOException $e) {
        error_log('Failed to inspect analyses columns: ' . $e->getMessage());
    }
    return $columns;
}

function analysisColumnExists($conn, $column) {
    $columns = getAnalysisColumnMap($conn);
    return isset($columns[$column]);
}

function getAnalysisInputValue($data, $keys) {
    foreach ($keys as $key) {
        if (array_key_exists($key, $data)) {
            return $data[$key];
        }
    }
    return null;
}

function normalizeTagsValue($value) {
    if (is_array($value)) {
        $tags = [];
        foreach ($value as $tag) {
            $tagText = trim((string) $tag);
            if ($tagText !== '') {
                $tags[] = $tagText;
            }
        }
        return count($tags) > 0 ? json_encode($tags) : null;
    }

    $tagText = trim((string) ($value ?? ''));
    return $tagText !== '' ? $tagText : null;
}

function getAnalyses($conn) {
    $memberId = $_GET['member_id'] ?? '';
    $organizationId = $_GET['organization_id'] ?? '';
    $teamId = $_GET['team_id'] ?? '';

    if (empty($memberId) && empty($organizationId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'member_id or organization_id is required']);
        return;
    }

    $status = $_GET['status'] ?? null;
    $limit = intval($_GET['limit'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);

    try {
        $sql = "SELECT * FROM analyses WHERE 1=1";
        $params = [];

        if (!empty($memberId)) {
            $sql .= " AND member_id = ?";
            $params[] = $memberId;
        }

        if (!empty($organizationId)) {
            $sql .= " AND organization_id = ?";
            $params[] = $organizationId;
        }

        if (!empty($teamId)) {
            $sql .= " AND team_id = ?";
            $params[] = $teamId;
        }

        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $analyses = $stmt->fetchAll();

        $countSql = "SELECT COUNT(*) as total FROM analyses WHERE 1=1";
        $countParams = [];

        if (!empty($memberId)) {
            $countSql .= " AND member_id = ?";
            $countParams[] = $memberId;
        }

        if (!empty($organizationId)) {
            $countSql .= " AND organization_id = ?";
            $countParams[] = $organizationId;
        }

        if (!empty($teamId)) {
            $countSql .= " AND team_id = ?";
            $countParams[] = $teamId;
        }

        if ($status) {
            $countSql .= " AND status = ?";
            $countParams[] = $status;
        }

        $countStmt = $conn->prepare($countSql);
        $countStmt->execute($countParams);
        $total = $countStmt->fetch()['total'];

        echo json_encode([
            'success' => true,
            'data' => $analyses,
            'pagination' => [
                'total' => intval($total),
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAnalysis($conn, $id) {
    try {
        $stmt = $conn->prepare("SELECT * FROM analyses WHERE id = ?");
        $stmt->execute([$id]);
        $analysis = $stmt->fetch();

        if (!$analysis) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Analysis not found']);
            return;
        }

        // Get detailed results if any
        $resultsStmt = $conn->prepare("
            SELECT r.*, a.name as antibiotic_name, a.category
            FROM results r
            LEFT JOIN antibiotics a ON r.antibiotic_id = a.antibiotic_id
            WHERE r.analysis_id = ?
        ");
        $resultsStmt->execute([$id]);
        $results = $resultsStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => [
                'analysis' => $analysis,
                'results' => $results
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function createAnalysis($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        $data = [];
    }

    $organizationId = $data['organization_id'] ?? $data['organizationId'] ?? '';
    $memberId = $data['member_id'] ?? $data['memberId'] ?? '';
    $teamId = $data['team_id'] ?? $data['teamId'] ?? '';

    if (empty($organizationId) && empty($memberId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'organization_id or member_id is required']);
        return;
    }

    try {
        $analysisId = generateShortAnalysisId($conn);
        $status = normalizeAnalysisStatusValue($data['status'] ?? null);
        $resultA = normalizeResultValue($data['antibiotic_a_result'] ?? $data['antibioticAResult'] ?? $data['result'] ?? null);
        $resultB = normalizeResultValue($data['antibiotic_b_result'] ?? $data['antibioticBResult'] ?? $data['secondaryResult'] ?? null);
        $testDate = $data['test_date'] ?? $data['actionDate'] ?? $data['date'] ?? null;
        if (!$testDate) {
            $testDate = date('Y-m-d H:i:s');
        }

        $analysisData = [
            'id' => $analysisId,
            'organization_id' => $organizationId ?: null,
            'team_id' => $teamId ?: null,
            'member_id' => $memberId ?: null,
            'sample_id' => getAnalysisInputValue($data, ['sample_id', 'sampleId']),
            'bacteria_name' => getAnalysisInputValue($data, ['bacteria_name', 'bacteriaName']),
            'specimen_type' => getAnalysisInputValue($data, ['specimen_type', 'specimenType']),
            'test_date' => $testDate,
            'status' => $status,
            'diameter' => $data['diameter'] ?? null,
            'antibiotic_a' => getAnalysisInputValue($data, ['antibiotic_a', 'antibioticA']),
            'antibiotic_a_desc' => getAnalysisInputValue($data, ['antibiotic_a_desc', 'antibioticADesc']),
            'antibiotic_a_result' => $resultA,
            'antibiotic_b' => getAnalysisInputValue($data, ['antibiotic_b', 'antibioticB']),
            'antibiotic_b_desc' => getAnalysisInputValue($data, ['antibiotic_b_desc', 'antibioticBDesc']),
            'antibiotic_b_result' => $resultB,
            'original_image' => getAnalysisInputValue($data, ['original_image', 'originalImage']),
            'processed_image' => getAnalysisInputValue($data, ['processed_image', 'processedImage']),
            'notes' => $data['notes'] ?? null,
            'technician' => $data['technician'] ?? null
        ];

        $optionalReportData = [
            'report_group_id' => getAnalysisInputValue($data, ['report_group_id', 'reportGroupId']),
            'report_display_id' => getAnalysisInputValue($data, ['report_display_id', 'reportDisplayId']),
            'report_name' => getAnalysisInputValue($data, ['report_name', 'reportName']),
            'tags' => normalizeTagsValue(getAnalysisInputValue($data, ['tags', 'report_tags', 'reportTags']))
        ];

        foreach ($optionalReportData as $column => $value) {
            if (analysisColumnExists($conn, $column)) {
                $analysisData[$column] = $value;
            }
        }

        $columns = array_keys($analysisData);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $stmt = $conn->prepare("INSERT INTO analyses (" . implode(', ', $columns) . ") VALUES ($placeholders)");
        $stmt->execute(array_values($analysisData));

        $selectStmt = $conn->prepare("SELECT * FROM analyses WHERE id = ?");
        $selectStmt->execute([$analysisId]);
        $newAnalysis = $selectStmt->fetch();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Analysis created successfully',
            'data' => $newAnalysis
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateAnalysis($conn, $id) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Analysis ID is required']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        $data = [];
    }

    try {
        // Check if analysis exists
        $checkStmt = $conn->prepare("SELECT id FROM analyses WHERE id = ?");
        $checkStmt->execute([$id]);
        
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Analysis not found']);
            return;
        }

        // Build dynamic update query
        $updateFields = [];
        $params = [];

        $allowedFields = [
            'report_group_id', 'reportGroupId' => 'report_group_id',
            'report_display_id', 'reportDisplayId' => 'report_display_id',
            'report_name', 'reportName' => 'report_name',
            'sample_id', 'sampleId' => 'sample_id',
            'tags', 'report_tags' => 'tags', 'reportTags' => 'tags',
            'bacteria_name', 'bacteriaName' => 'bacteria_name',
            'specimen_type', 'specimenType' => 'specimen_type',
            'status',
            'diameter',
            'antibiotic_a', 'antibioticA' => 'antibiotic_a',
            'antibiotic_a_desc', 'antibioticADesc' => 'antibiotic_a_desc',
            'antibiotic_a_result', 'result' => 'antibiotic_a_result',
            'antibiotic_b', 'antibioticB' => 'antibiotic_b',
            'antibiotic_b_desc', 'antibioticBDesc' => 'antibiotic_b_desc',
            'antibiotic_b_result', 'secondaryResult' => 'antibiotic_b_result',
            'original_image', 'originalImage' => 'original_image',
            'processed_image', 'processedImage' => 'processed_image',
            'notes',
            'technician',
            'test_date', 'actionDate' => 'test_date', 'date' => 'test_date'
        ];

        $analysisColumns = getAnalysisColumnMap($conn);
        foreach ($data as $key => $value) {
            $dbField = $allowedFields[$key] ?? (in_array($key, $allowedFields) ? $key : null);
            if ($dbField && isset($analysisColumns[$dbField])) {
                if ($dbField === 'status') {
                    $value = normalizeAnalysisStatusValue($value);
                }
                if ($dbField === 'antibiotic_a_result' || $dbField === 'antibiotic_b_result') {
                    $value = normalizeResultValue($value);
                }
                if ($dbField === 'tags') {
                    $value = normalizeTagsValue($value);
                }
                $updateFields[] = "$dbField = ?";
                $params[] = $value;
            }
        }

        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
            return;
        }

        $params[] = $id;
        $sql = "UPDATE analyses SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        // Fetch updated analysis
        $selectStmt = $conn->prepare("SELECT * FROM analyses WHERE id = ?");
        $selectStmt->execute([$id]);
        $updatedAnalysis = $selectStmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => 'Analysis updated successfully',
            'data' => $updatedAnalysis
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function deleteAnalysis($conn, $id) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Analysis ID is required']);
        return;
    }

    // Optional: verify ownership
    $memberId = $_GET['member_id'] ?? '';
    $organizationId = $_GET['organization_id'] ?? '';

    try {
        $sql = "DELETE FROM analyses WHERE id = ?";
        $params = [$id];

        if ($memberId) {
            $sql .= " AND member_id = ?";
            $params[] = $memberId;
        } elseif ($organizationId) {
            $sql .= " AND organization_id = ?";
            $params[] = $organizationId;
        }

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Analysis not found or not authorized']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Analysis deleted successfully'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
