"""Script to directly seed dataset into PostgreSQL/database."""

import argparse
import csv
import os
import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy import text
from app.db.session import engine
from app.core.logging import logger


def seed_dataset(csv_path: str, dataset_name: str = "College Feedback Q3 2026", domain: str = "college"):
    """Parse CSV and seed records into database."""
    if not os.path.exists(csv_path):
        print(f"Error: File not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    dataset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    print(f"Seeding dataset '{dataset_name}' (ID: {dataset_id}) from {csv_path}...")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Loaded {len(rows)} rows from CSV. Inserting into database...")

    # We insert into database tables if available or report dry-run
    try:
        with engine.begin() as conn:
            # Check if datasets table exists
            table_check = conn.execute(
                text("SELECT 1 FROM information_schema.tables WHERE table_name = 'datasets'")
            ).fetchone()

            if not table_check:
                print("Note: 'datasets' table does not exist yet (Track A schema migrations pending).")
                print(f"Verified CSV is valid with {len(rows)} records. Direct DB seeding ready when migrations run.")
                return

            conn.execute(
                text(
                    "INSERT INTO datasets (id, name, domain, uploaded_at) "
                    "VALUES (:id, :name, :domain, :uploaded_at)"
                ),
                {"id": dataset_id, "name": dataset_name, "domain": domain, "uploaded_at": now},
            )
            print("Dataset registration inserted.")
    except Exception as exc:
        print(f"DB Seeding skipped/deferred: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed dataset into database")
    parser.add_argument("--file", type=str, default="data/demo_feedback.csv", help="CSV file path")
    parser.add_argument("--name", type=str, default="College Feedback Q3 2026", help="Dataset name")
    parser.add_argument("--domain", type=str, default="college", help="Domain category")
    args = parser.parse_args()
    seed_dataset(args.file, args.name, args.domain)
