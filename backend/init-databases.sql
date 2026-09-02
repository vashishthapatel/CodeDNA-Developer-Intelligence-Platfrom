-- Create databases for each microservice
CREATE DATABASE codedna_auth;
CREATE DATABASE codedna_repository;
CREATE DATABASE codedna_scoring;
CREATE DATABASE codedna_recommendations;

-- Connect to auth database and create tables
\c codedna_auth;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    handle VARCHAR(100),
    title VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    location VARCHAR(255),
    company VARCHAR(255),
    github_connected BOOLEAN DEFAULT FALSE,
    github_username VARCHAR(255),
    github_access_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connect to repository database and create tables
\c codedna_repository;

CREATE TABLE IF NOT EXISTS repositories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    description TEXT,
    primary_language VARCHAR(100),
    languages JSONB,
    stars INT DEFAULT 0,
    forks INT DEFAULT 0,
    commits INT DEFAULT 0,
    pull_requests INT DEFAULT 0,
    issues INT DEFAULT 0,
    contributors INT DEFAULT 0,
    dna_contribution DECIMAL(5,2) DEFAULT 0.0,
    visibility VARCHAR(50) DEFAULT 'public',
    code_quality DECIMAL(5,2) DEFAULT 0.0,
    test_coverage DECIMAL(5,2) DEFAULT 0.0,
    documentation DECIMAL(5,2) DEFAULT 0.0,
    complexity DECIMAL(5,2) DEFAULT 0.0,
    stack JSONB,
    patterns JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);

-- Connect to scoring database and create tables
\c codedna_scoring;

CREATE TABLE IF NOT EXISTS dna_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    score DECIMAL(5,2) NOT NULL,
    label VARCHAR(50) NOT NULL,
    strongest_area VARCHAR(100),
    recommended_skill VARCHAR(100),
    archetype VARCHAR(100),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dna_profiles_user_id ON dna_profiles(user_id);

-- Connect to recommendations database and create tables
\c codedna_recommendations;

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT,
    difficulty VARCHAR(50),
    duration VARCHAR(100),
    category VARCHAR(100),
    match_score INT DEFAULT 0,
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
