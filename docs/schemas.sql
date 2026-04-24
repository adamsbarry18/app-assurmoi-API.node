-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),

    role ENUM(
        'ADMIN',
        'PORTFOLIO_MANAGER',
        'TRACKING_OFFICER',
        'CUSTOMER_OFFICER',
        'INSURED'
    ) NOT NULL,

    session_token TEXT,
    refresh_token TEXT,
    two_factor_code VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    password_pending BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- DOCUMENTS TABLE
-- =========================
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,

    type ENUM(
        'ID_CARD',
        'REGISTRATION_CARD',
        'INSURANCE_CERT',
        'EXPERT_REPORT',
        'INVOICE',
        'RIB',
        'SIGNATURE'
    ) NOT NULL,

    storage_url VARCHAR(512),
    is_validated BOOLEAN DEFAULT FALSE,
    uploaded_by_id INT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_uploaded_by
        FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

-- =========================
-- SINISTERS TABLE
-- =========================
CREATE TABLE sinisters (
    id INT AUTO_INCREMENT PRIMARY KEY,

    vehicle_plate VARCHAR(50) NOT NULL,

    driver_first_name VARCHAR(255),
    driver_last_name VARCHAR(255),
    is_driver_insured BOOLEAN DEFAULT FALSE,

    call_datetime DATETIME NOT NULL,
    incident_datetime DATETIME NOT NULL,

    description TEXT,

    driver_responsability BOOLEAN DEFAULT FALSE,
    driver_engaged_responsibility INT,

    cni_driver INT,
    vehicle_registration_doc_id INT,
    insurance_certificate_id INT,

    is_validated_by_manager BOOLEAN DEFAULT FALSE,

    created_by_id INT,
    insured_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sinister_cni_driver
        FOREIGN KEY (cni_driver) REFERENCES documents(id),

    CONSTRAINT fk_sinister_vehicle_doc
        FOREIGN KEY (vehicle_registration_doc_id) REFERENCES documents(id),

    CONSTRAINT fk_sinister_insurance_doc
        FOREIGN KEY (insurance_certificate_id) REFERENCES documents(id),

    CONSTRAINT fk_sinister_created_by
        FOREIGN KEY (created_by_id) REFERENCES users(id),

    CONSTRAINT fk_sinister_insured_user
        FOREIGN KEY (insured_user_id) REFERENCES users(id)
);

-- =========================
-- SINISTER FOLDERS TABLE
-- =========================
CREATE TABLE sinister_folders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    sinister_id INT NOT NULL UNIQUE,

    folder_reference VARCHAR(100) UNIQUE,

    status ENUM(
        'INITIALIZED',
        'EXPERTISE_PENDING',
        'REPAIR_PLANNED',
        'COMPENSATION_PENDING',
        'CLOSED'
    ),

    scenario ENUM(
        'REPAIRABLE',
        'TOTAL_LOSS'
    ),

    is_closed BOOLEAN DEFAULT FALSE,

    assigned_officer_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_folder_sinister
        FOREIGN KEY (sinister_id) REFERENCES sinisters(id),

    CONSTRAINT fk_folder_officer
        FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
);

-- =========================
-- FOLDER STEPS TABLE
-- =========================
CREATE TABLE folder_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,

    folder_id INT NOT NULL,

    step_type VARCHAR(255),

    value TEXT,

    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    document_id INT NULL,

    performed_by_id INT,

    CONSTRAINT fk_step_folder
        FOREIGN KEY (folder_id) REFERENCES sinister_folders(id),

    CONSTRAINT fk_step_document
        FOREIGN KEY (document_id) REFERENCES documents(id),

    CONSTRAINT fk_step_user
        FOREIGN KEY (performed_by_id) REFERENCES users(id)
);

-- =========================
-- HISTORY LOGS TABLE
-- =========================
CREATE TABLE history_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    entity_type VARCHAR(255),
    entity_id INT,

    action VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- NOTIFICATIONS TABLE
-- =========================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    content TEXT,

    channel ENUM('EMAIL', 'PUSH'),

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);