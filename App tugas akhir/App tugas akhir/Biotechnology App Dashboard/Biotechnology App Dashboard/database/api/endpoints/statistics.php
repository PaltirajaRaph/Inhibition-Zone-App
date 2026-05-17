<?php
/**
 * Statistics Endpoints
 * - GET /statistics?member_id=xxx - Get member statistics
 * - GET /statistics?organization_id=xxx - Get organization statistics
 */

function handleStatistics($conn, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        return;
    }

    $memberId = $_GET['member_id'] ?? '';
    $organizationId = $_GET['organization_id'] ?? '';
    $trendUnit = strtolower(trim((string) ($_GET['trend'] ?? 'month')));
    $trendWindowInput = intval($_GET['trend_window'] ?? 0);

    if (empty($memberId) && empty($organizationId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'member_id or organization_id is required']);
        return;
    }

    $where = "1=1";
    $params = [];
    if (!empty($memberId)) {
        $where .= " AND member_id = ?";
        $params[] = $memberId;
    }
    if (!empty($organizationId)) {
        $where .= " AND organization_id = ?";
        $params[] = $organizationId;
    }

    $trendDefaults = [
        'day' => 7,
        'week' => 12,
        'month' => 6,
        'year' => 5,
    ];

    if (!isset($trendDefaults[$trendUnit])) {
        $trendUnit = 'month';
    }

    $trendWindow = $trendWindowInput > 0 ? $trendWindowInput : $trendDefaults[$trendUnit];

    try {
        // Overall statistics
        $statsStmt = $conn->prepare("
            SELECT 
                COUNT(*) AS total_analyses,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
            FROM analyses
            WHERE {$where}
        ");
        $statsStmt->execute($params);
        $stats = $statsStmt->fetch();

        // Result distribution
        $resultStmt = $conn->prepare("
            SELECT 
                SUM(CASE WHEN antibiotic_a_result = 'resistant' THEN 1 ELSE 0 END) +
                SUM(CASE WHEN antibiotic_b_result = 'resistant' THEN 1 ELSE 0 END) AS resistant_count,
                
                SUM(CASE WHEN antibiotic_a_result = 'susceptible' THEN 1 ELSE 0 END) +
                SUM(CASE WHEN antibiotic_b_result = 'susceptible' THEN 1 ELSE 0 END) AS susceptible_count,
                
                SUM(CASE WHEN antibiotic_a_result = 'intermediate' THEN 1 ELSE 0 END) +
                SUM(CASE WHEN antibiotic_b_result = 'intermediate' THEN 1 ELSE 0 END) AS intermediate_count,

                SUM(CASE WHEN antibiotic_a_result = 'indeterminate' THEN 1 ELSE 0 END) +
                SUM(CASE WHEN antibiotic_b_result = 'indeterminate' THEN 1 ELSE 0 END) AS indeterminate_count
            FROM analyses
            WHERE {$where} AND status = 'completed'
        ");
        $resultStmt->execute($params);
        $results = $resultStmt->fetch();

        // Bacteria distribution
        $bacteriaStmt = $conn->prepare("
            SELECT bacteria_name, COUNT(*) as count
            FROM analyses
            WHERE {$where} AND bacteria_name IS NOT NULL
            GROUP BY bacteria_name
            ORDER BY count DESC
            LIMIT 10
        ");
        $bacteriaStmt->execute($params);
        $bacteriaDistribution = $bacteriaStmt->fetchAll();

        // Antibiotic usage
        $antibioticStmt = $conn->prepare("
            SELECT antibiotic_a as antibiotic, COUNT(*) as count
            FROM analyses
            WHERE {$where} AND antibiotic_a IS NOT NULL
            GROUP BY antibiotic_a
            UNION ALL
            SELECT antibiotic_b as antibiotic, COUNT(*) as count
            FROM analyses
            WHERE {$where} AND antibiotic_b IS NOT NULL
            GROUP BY antibiotic_b
        ");
        $antibioticStmt->execute([...$params, ...$params]);
        $antibioticUsageRaw = $antibioticStmt->fetchAll();

        // Aggregate antibiotic usage
        $antibioticUsage = [];
        foreach ($antibioticUsageRaw as $row) {
            $name = $row['antibiotic'];
            if (!isset($antibioticUsage[$name])) {
                $antibioticUsage[$name] = 0;
            }
            $antibioticUsage[$name] += $row['count'];
        }
        arsort($antibioticUsage);
        $antibioticUsage = array_slice($antibioticUsage, 0, 10, true);

        // Trend
        $trendSql = '';
        $trendParams = $params;
        if ($trendUnit === 'day') {
            $trendSql = "
                SELECT
                    DATE(test_date) AS label,
                    COUNT(*) AS count
                FROM analyses
                WHERE {$where} AND test_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(test_date)
                ORDER BY DATE(test_date) ASC
            ";
            $trendParams[] = $trendWindow;
        } elseif ($trendUnit === 'week') {
            $trendSql = "
                SELECT
                    YEARWEEK(test_date, 1) AS period_key,
                    DATE_FORMAT(MIN(test_date), '%Y-%m-%d') AS label,
                    COUNT(*) AS count
                FROM analyses
                WHERE {$where} AND test_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
                GROUP BY period_key
                ORDER BY period_key ASC
            ";
            $trendParams[] = $trendWindow;
        } elseif ($trendUnit === 'year') {
            $trendSql = "
                SELECT
                    YEAR(test_date) AS label,
                    COUNT(*) AS count
                FROM analyses
                WHERE {$where} AND test_date >= DATE_SUB(CURDATE(), INTERVAL ? YEAR)
                GROUP BY YEAR(test_date)
                ORDER BY YEAR(test_date) ASC
            ";
            $trendParams[] = $trendWindow;
        } else {
            $trendSql = "
                SELECT
                    DATE_FORMAT(test_date, '%Y-%m') AS label,
                    COUNT(*) AS count
                FROM analyses
                WHERE {$where} AND test_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
                GROUP BY DATE_FORMAT(test_date, '%Y-%m')
                ORDER BY DATE_FORMAT(test_date, '%Y-%m') ASC
            ";
            $trendParams[] = $trendWindow;
        }

        $trendStmt = $conn->prepare($trendSql);
        $trendStmt->execute($trendParams);
        $trendRows = $trendStmt->fetchAll();

        $trendPoints = array_map(function ($row) {
            return [
                'label' => (string) ($row['label'] ?? ''),
                'count' => intval($row['count'] ?? 0),
            ];
        }, $trendRows ?: []);

        // Recent analyses
        $recentStmt = $conn->prepare("
            SELECT id, bacteria_name, antibiotic_a, antibiotic_a_result, status, test_date
            FROM analyses
            WHERE {$where}
            ORDER BY test_date DESC
            LIMIT 5
        ");
        $recentStmt->execute($params);
        $recentAnalyses = $recentStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_analyses' => intval($stats['total_analyses']),
                    'completed' => intval($stats['completed']),
                    'pending' => intval($stats['pending']),
                    'processing' => intval($stats['processing']),
                    'failed' => intval($stats['failed']),
                    'completion_rate' => $stats['total_analyses'] > 0 
                        ? round(($stats['completed'] / $stats['total_analyses']) * 100, 1) 
                        : 0
                ],
                'results' => [
                    'resistant' => intval($results['resistant_count'] ?? 0),
                    'susceptible' => intval($results['susceptible_count'] ?? 0),
                    'intermediate' => intval($results['intermediate_count'] ?? 0),
                    'indeterminate' => intval($results['indeterminate_count'] ?? 0)
                ],
                'bacteria_distribution' => $bacteriaDistribution,
                'antibiotic_usage' => $antibioticUsage,
                'trend' => [
                    'unit' => $trendUnit,
                    'window' => $trendWindow,
                    'points' => $trendPoints
                ],
                'recent_analyses' => $recentAnalyses
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
