-- Telugu News Project Traceability Database
-- Created: 2026-04-25
-- Purpose: Track all changes, features, and fixes

-- Project initialization and major milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone TEXT NOT NULL,
    description TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feature implementation log
CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    implemented_at DATETIME
);

-- Issues encountered and resolutions
CREATE TABLE IF NOT EXISTS issues_resolved (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_description TEXT NOT NULL,
    solution TEXT,
    resolved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File structure changes
CREATE TABLE IF NOT EXISTS codebase_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    file_path TEXT,
    description TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API endpoints documentation
CREATE TABLE IF NOT EXISTS api_endpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration changes
CREATE TABLE IF NOT EXISTS config_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
