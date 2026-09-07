-- Feedback Intelligence OS: PostgreSQL initialization script
-- Automatically run on container first boot by Postgres entrypoint

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Verify extensions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'Failed to install pgvector extension';
    END IF;
END $$;
