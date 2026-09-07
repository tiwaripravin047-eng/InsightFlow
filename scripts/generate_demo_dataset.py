"""Deterministic Synthetic Demo Dataset Generator for Feedback Intelligence OS.

Generates ~5,000 rows of realistic, domain-agnostic feedback data with a fixed
deterministic seed. Realizes all 6 required synthetic patterns:
1. Established issue (Hostel plumbing / maintenance)
2. Emerging issue (Wi-Fi connectivity / disconnections surge)
3. Single-day spike negative control (Campus bus breakdown on 2026-09-02)
4. Repeated complaints with semantic phrasing variations
5. Cross-category issue (Wi-Fi across Hostel, Library, Academics)
6. Noisy / realistic text (typos, punctuation, Hinglish, varying lengths)

CRITICAL RULE: No precomputed AI columns (no ai_sentiment, ai_topic, ai_priority).
Columns: feedback_text, created_at, category, source, rating
"""

import argparse
import csv
import os
import random
from datetime import datetime, timedelta, timezone

CATEGORIES = [
    "Wi-Fi/Internet",
    "Hostel",
    "Cafeteria",
    "Academics",
    "Library",
    "Transportation",
    "Administration",
    "Facilities",
    "Security",
    "Events",
    "Fees",
    "Cleanliness",
    "Sports",
]

SOURCES = ["survey", "review", "support ticket", "feedback form", "email"]

# Pattern 1: Established issue (Steady complaint volume across the entire window)
ESTABLISHED_COMPLAINTS = [
    "Hot water is rarely available in block A bathrooms during morning hours.",
    "Hostel geysers in block C are still leaking despite repeated complaints.",
    "Plumbing maintenance in block B is very slow, taps are constantly dripping.",
    "Bathroom flush in hostel room 304 not working properly since two weeks.",
    "Drainage in ground floor washroom gets clogged every few days.",
    "Hostel room switchboards are loose and maintenance hasn't fixed them yet.",
    "Hostel bathroom cleanliness is substandard, cleaning staff does not show up daily.",
    "Water pressure in 4th floor hostel showers is almost zero in the morning.",
]

# Pattern 2: Emerging issue (Low historical volume in July/Aug, rapid sustained rise in late Aug/Sept)
EMERGING_COMPLAINTS = [
    "Wi-Fi disconnects every 15 minutes during project work, unbearable!",
    "Campus internet speed has plummeted drastically this week.",
    "Unable to attend online lab sessions because the Wi-Fi signal drops constantly.",
    "Wi-Fi authentication gateway times out repeatedly when submitting assignments.",
    "Terrible network latency on campus Wi-Fi, even Google searches fail to load.",
    "Internet in common areas is completely unusable after the recent router update.",
    "Frequent packet drops on campus Wi-Fi make attending virtual lectures impossible.",
    "Wi-Fi keeps kicking devices off the network every few minutes.",
]

# Pattern 3: Single-day spike negative control (Confined almost entirely to 2026-09-02)
SPIKE_COMPLAINTS = [
    "Route 4 campus shuttle bus breakdown near South Gate causing 1 hour delay.",
    "Morning 8:30 AM campus bus breakdown had engine smoke and stranded students on ring road.",
    "Shuttle service halted today due to campus bus breakdown at main gate.",
    "Missed morning quiz because the 8:15 transit bus breakdown mid-route.",
    "Bus breakdown near hostel circle created huge traffic jam and delay for exam batch.",
    "Campus shuttle bus breakdown with tire puncture caused total chaos for 9 AM lectures today.",
    "Emergency bus breakdown on South corridor stranded 50 students this morning.",
]

# Pattern 4: Repeated complaints with wording variation (for semantic duplicate/clustering testing)
SEMANTIC_VARIATION_TEMPLATES = [
    "wifi keeps disconnecting in library",
    "Wi-Fi is constantly dropping in the central library reading room",
    "Cannot connect to library internet, frequent disconnects experienced",
    "Library wifi keeps dropping connection every 10 minutes, cannot study",
    "wifi disconnect issue in reading hall again and again, plz fix ASAP",
    "Central library Wi-Fi connectivity is extremely unstable this week",
    "Continuous wi-fi dropouts while studying on 2nd floor of library",
    "Internet keeps shutting off while researching in the university library",
]

# Pattern 5: Cross-category issue (Wi-Fi root issue surfacing across Hostel, Library, Academics)
CROSS_CATEGORY_TEMPLATES = [
    ("Hostel", "Hostel Block D has zero Wi-Fi signal in corner rooms, forced to use mobile hotspot."),
    ("Hostel", "Wi-Fi in hostel common room has been down for three days straight."),
    ("Library", "Library reading room Wi-Fi fails every time more than 20 students join."),
    ("Library", "Cannot download research papers from library digital section due to no Wi-Fi."),
    ("Academics", "Department lab computers cannot access intranet because academic Wi-Fi is failing."),
    ("Academics", "Submission portal timed out during class quiz due to poor lecture hall Wi-Fi."),
]

# Pattern 6: Noisy/realistic text with typos, informal tone, Hinglish
NOISY_COMPLAINTS = [
    "wfi in cafetaria is totally not working yaar... plz do the needful ASAP!!",
    "hostle mess food is so cold by 7pm, not even eatable seriously :(",
    "profesor did not upload slides before midsem exam... vry frustrating.",
    "Fees payment portal debited my account twice!! Kindly revert the amount quickly.",
    "Cleanliness of admin block stairs is pathetic, dust everywhere since monday.",
    "Gym treadmill belt is slipping, safety hazard!! kindly look into this matter.",
    "Admin staff was extremely rude when I went for fee concession verification.",
    "Security at night gate is stopping day-scholars unnecessarily without reason.",
    "Air conditioning in seminar hall 2 is leaking water on the front row seats.",
    "Great workshop conducted by robotics club! Really learned a lot.",
    "Cafeteria dosa counter service has improved significantly this semester, kudos!",
    "Library staff was very helpful with issuing reference textbooks today.",
    "Hostel warden resolved the water cooler issue promptly, thank you.",
]

# General background templates across categories
BACKGROUND_TEMPLATES = {
    "Cafeteria": [
        ("food quality is mediocre, especially dinner menu is repetitive", 2),
        ("morning breakfast poha and upma are quite decent and fresh", 4),
        ("mess cutlery is often greasy and not cleaned thoroughly", 1),
        ("coffee machine in main canteen was broken for two days", 2),
        ("juice bar offers great healthy options at subsidized student rates", 5),
    ],
    "Academics": [
        ("faculty feedback process is transparent and taken seriously by HOD", 4),
        ("schedule for end semester practical exams overlaps with elective test", 2),
        ("professors are approachable during designated office consultation hours", 5),
        ("lab equipment for digital electronics is outdated and some kits are faulty", 2),
    ],
    "Library": [
        ("study desks in quiet section are comfortable and well-lit", 5),
        ("need more copies of the latest edition algorithms reference book", 3),
        ("digital library terminal mice are sticky and need replacement", 2),
    ],
    "Transportation": [
        ("bus frequency during peak evening hours between 5pm-6pm is adequate", 4),
        ("driver on route 7 drives aggressively on speed breakers, please check", 2),
        ("weekend transit schedule should include an extra night service from metro station", 3),
    ],
    "Facilities": [
        ("water coolers on third floor are functioning smoothly and chilled", 4),
        ("elevator in engineering block was under maintenance during morning rush", 2),
        ("classroom projectors in block 2 have low lamp brightness", 2),
    ],
    "Security": [
        ("campus security personnel are vigilant and polite at main vehicle checkpost", 5),
        ("street lights near basketball court are flickering, feels unsafe at night", 2),
    ],
    "Cleanliness": [
        ("campus grounds are kept remarkably green and litter-free", 5),
        ("dustbins in cafeteria annex area overflow during lunch rush hours", 2),
        ("restrooms in ground floor management block need more frequent checks", 2),
    ],
    "Sports": [
        ("badminton court wooden flooring has been maintained in top shape", 5),
        ("cricket nets require replacement as the netting has torn at several places", 2),
    ],
    "Administration": [
        ("transcript request was processed within 2 working days, very impressed", 5),
        ("long queues at student welfare window due to single staff member operating", 2),
    ],
    "Events": [
        ("cultural fest organization was seamless and guest lectures were inspiring", 5),
        ("acoustics in the main auditorium were distorted during the musical evening", 3),
    ],
    "Fees": [
        ("online fee receipt generation is instant and hassle-free", 4),
        ("late fee penalty policy is too rigid when bank server transactions fail", 2),
    ],
}


def generate_dataset(
    num_rows: int = 5000,
    seed: int = 42,
    start_date: datetime = datetime(2026, 7, 8, 8, 0, 0, tzinfo=timezone.utc),
    end_date: datetime = datetime(2026, 9, 6, 22, 0, 0, tzinfo=timezone.utc),
) -> list:
    """Generate deterministic feedback rows with controlled patterns."""
    random.seed(seed)

    rows = []
    total_seconds = int((end_date - start_date).total_seconds())

    # Date anchor for spike: 2026-09-02
    spike_start = datetime(2026, 9, 2, 6, 0, 0, tzinfo=timezone.utc)
    spike_seconds = 14 * 3600  # Within 14 hours on Sept 2

    # Date anchor for emerging surge: 2026-08-28 to 2026-09-06
    emerging_surge_start = datetime(2026, 8, 28, 0, 0, 0, tzinfo=timezone.utc)
    emerging_surge_duration = int((end_date - emerging_surge_start).total_seconds())

    # 1. Inject Established Issue (~350 rows spread uniformly across entire 60 days)
    for _ in range(350):
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        text = random.choice(ESTABLISHED_COMPLAINTS)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": "Hostel",
            "source": random.choice(SOURCES),
            "rating": random.choice([1, 2]),
        })

    # 2. Inject Emerging Issue (~300 rows: 25 in early period, 275 surging across late Aug-Sept)
    # Early baseline (July 8 to Aug 27)
    early_seconds = int((emerging_surge_start - start_date).total_seconds())
    for _ in range(25):
        dt = start_date + timedelta(seconds=random.randint(0, early_seconds))
        text = random.choice(EMERGING_COMPLAINTS)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": "Wi-Fi/Internet",
            "source": random.choice(SOURCES),
            "rating": 1,
        })
    # Surging period (Aug 28 to Sept 6 - sustained growth over 9 days)
    for _ in range(275):
        dt = emerging_surge_start + timedelta(seconds=random.randint(0, emerging_surge_duration))
        text = random.choice(EMERGING_COMPLAINTS)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": "Wi-Fi/Internet",
            "source": random.choice(SOURCES),
            "rating": random.choice([1, 2]),
        })

    # 3. Inject Single-day spike negative control (35 rows tightly focused on 2026-09-02)
    for _ in range(35):
        dt = spike_start + timedelta(seconds=random.randint(0, spike_seconds))
        text = random.choice(SPIKE_COMPLAINTS)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": "Transportation",
            "source": random.choice(SOURCES),
            "rating": 1,
        })

    # 4. Inject Repeated complaints with wording variation (~120 rows)
    for _ in range(120):
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        text = random.choice(SEMANTIC_VARIATION_TEMPLATES)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": "Library",
            "source": random.choice(SOURCES),
            "rating": random.choice([1, 2]),
        })

    # 5. Inject Cross-category Wi-Fi issue (~180 rows across Hostel, Library, Academics)
    for _ in range(180):
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        cat, text = random.choice(CROSS_CATEGORY_TEMPLATES)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": cat,
            "source": random.choice(SOURCES),
            "rating": random.choice([1, 2]),
        })

    # 6. Inject Noisy / realistic / Hinglish complaints (~200 rows)
    for _ in range(200):
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        text = random.choice(NOISY_COMPLAINTS)
        cat = random.choice(CATEGORIES)
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": cat,
            "source": random.choice(SOURCES),
            "rating": random.choice([1, 2, 3, 4, 5]),
        })

    # Controlled Data Quality injection:
    # 4 empty text rows (to test validation report per API_CONTRACTS.md)
    for _ in range(4):
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        rows.append({
            "feedback_text": "",
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": random.choice(CATEGORIES),
            "source": random.choice(SOURCES),
            "rating": random.choice([1, 2, 3, 4, 5]),
        })

    # Controlled duplicate rows (12 exact duplicates)
    duplicate_seed = {
        "feedback_text": "Hostel block A washroom flush is broken and leaking.",
        "created_at": "2026-08-15 10:30:00",
        "category": "Hostel",
        "source": "survey",
        "rating": 1,
    }
    for _ in range(12):
        rows.append(dict(duplicate_seed))

    # Fill remaining rows up to num_rows with realistic background feedback
    remaining = num_rows - len(rows)
    all_cats = list(BACKGROUND_TEMPLATES.keys())
    for _ in range(remaining):
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        cat = random.choice(all_cats)
        text, rating = random.choice(BACKGROUND_TEMPLATES[cat])
        rows.append({
            "feedback_text": text,
            "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "category": cat,
            "source": random.choice(SOURCES),
            "rating": rating,
        })

    # Sort deterministically by created_at, then category, then feedback_text
    rows.sort(key=lambda r: (r["created_at"], r["category"], r["feedback_text"]))
    return rows


def write_csv(rows: list, output_path: str):
    """Write rows to CSV file with utf-8 encoding."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    fieldnames = ["feedback_text", "created_at", "category", "source", "rating"]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic demo feedback dataset")
    parser.add_argument("--rows", type=int, default=5000, help="Number of rows to generate (default: 5000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic output (default: 42)")
    parser.add_argument("--domain", type=str, default="college", help="Domain context (default: college)")
    parser.add_argument("--out", type=str, default="data/demo_feedback.csv", help="Output path (default: data/demo_feedback.csv)")
    args = parser.parse_args()

    print(f"Generating {args.rows} feedback rows (seed={args.seed}, domain={args.domain})...")
    rows = generate_dataset(num_rows=args.rows, seed=args.seed)
    write_csv(rows, args.out)
    print(f"Dataset successfully saved to {args.out} ({len(rows)} rows).")


if __name__ == "__main__":
    main()
