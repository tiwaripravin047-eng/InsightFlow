"""Tests for Phase 2: Realistic Demo Dataset Generation."""

import csv
import hashlib
import os
import pytest
from scripts.generate_demo_dataset import generate_dataset, write_csv


def test_dataset_reproducibility(tmp_path):
    """Verify running generator with same seed produces byte-for-byte identical output."""
    file1 = tmp_path / "dataset1.csv"
    file2 = tmp_path / "dataset2.csv"

    rows1 = generate_dataset(num_rows=1000, seed=42)
    write_csv(rows1, str(file1))

    rows2 = generate_dataset(num_rows=1000, seed=42)
    write_csv(rows2, str(file2))

    with open(file1, "rb") as f1, open(file2, "rb") as f2:
        hash1 = hashlib.sha256(f1.read()).hexdigest()
        hash2 = hashlib.sha256(f2.read()).hexdigest()

    assert hash1 == hash2


def test_dataset_columns_and_row_count():
    """Verify ~5000 rows, required columns, and strict absence of precomputed AI columns."""
    rows = generate_dataset(num_rows=5000, seed=42)
    assert len(rows) == 5000

    expected_cols = {"feedback_text", "created_at", "category", "source", "rating"}
    forbidden_cols = {"ai_sentiment", "ai_topic", "ai_confidence", "ai_priority", "sentiment", "topic"}

    for r in rows[:100]:
        assert set(r.keys()) == expected_cols
        assert not any(col in r for col in forbidden_cols)


def test_required_synthetic_patterns():
    """Verify all 6 required synthetic patterns exist and are locatable."""
    rows = generate_dataset(num_rows=5000, seed=42)

    # Pattern 1: Established issue (Hostel plumbing / maintenance across dates)
    hostel_complaints = [
        r for r in rows
        if r["category"] == "Hostel" and any(w in r["feedback_text"].lower() for w in ["flush", "leaking", "geyser", "plumbing", "hot water"])
    ]
    assert len(hostel_complaints) >= 100

    # Pattern 2: Emerging issue (Wi-Fi surge late Aug - Sept vs July)
    wifi_july = [
        r for r in rows
        if r["category"] == "Wi-Fi/Internet" and r["created_at"].startswith("2026-07")
    ]
    wifi_sept = [
        r for r in rows
        if r["category"] == "Wi-Fi/Internet" and r["created_at"].startswith("2026-09")
    ]
    # Emerging pattern should have significantly higher volume in Sept than early July
    assert len(wifi_sept) > len(wifi_july) * 2

    # Pattern 3: Single-day spike negative control (Bus breakdown on 2026-09-02)
    bus_spike_day = [
        r for r in rows
        if "shuttle" in r["feedback_text"].lower() or "breakdown" in r["feedback_text"].lower()
    ]
    sept_2_breakdowns = [r for r in bus_spike_day if r["created_at"].startswith("2026-09-02")]
    assert len(sept_2_breakdowns) >= 30

    # Pattern 4: Repeated complaints with wording variation
    library_wifi_variants = [
        r for r in rows
        if "library" in r["feedback_text"].lower() and ("wifi" in r["feedback_text"].lower() or "wi-fi" in r["feedback_text"].lower())
    ]
    assert len(library_wifi_variants) >= 20
    # Confirm diverse distinct texts
    distinct_phrasings = {r["feedback_text"] for r in library_wifi_variants}
    assert len(distinct_phrasings) >= 5

    # Pattern 5: Cross-category issue (Wi-Fi across Hostel, Library, Academics)
    wifi_categories = {
        r["category"] for r in rows
        if "wi-fi" in r["feedback_text"].lower() or "wifi" in r["feedback_text"].lower()
    }
    assert {"Hostel", "Library", "Academics"}.issubset(wifi_categories)

    # Pattern 6: Noisy/realistic text with typos and Hinglish
    noisy = [
        r for r in rows
        if any(w in r["feedback_text"].lower() for w in ["wfi", "hostle", "yaar", "plz", "vry", "kindly revert"])
    ]
    assert len(noisy) >= 20


def test_controlled_data_quality():
    """Verify controlled empty rows and duplicate rows for validation testing."""
    rows = generate_dataset(num_rows=5000, seed=42)

    empty_rows = [r for r in rows if r["feedback_text"] == ""]
    assert len(empty_rows) == 4

    # Check duplicates
    duplicate_text = "Hostel block A washroom flush is broken and leaking."
    duplicates = [r for r in rows if r["feedback_text"] == duplicate_text]
    assert len(duplicates) == 12
