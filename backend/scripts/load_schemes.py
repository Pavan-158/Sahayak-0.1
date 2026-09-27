"""
Script to load schemes from CSV into SQLite database.
Run with: python scripts/load_schemes.py
"""

import os
import sys
import csv
import uuid
import sqlite3

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_tables(db_path: str = "sahayak.db"):
    """Create database tables if they don't exist."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schemes (
        id TEXT PRIMARY KEY,
        scheme_name TEXT NOT NULL,
        state TEXT NOT NULL,
        state_code TEXT NOT NULL,
        level TEXT,
        category TEXT,
        eligibility TEXT,
        benefits TEXT,
        application_process TEXT,
        documents_required TEXT,
        official_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Database tables created")


def load_from_csv(csv_path: str, db_path: str = "sahayak.db"):
    """Load schemes from CSV file into database."""
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        print("Creating sample data instead...")
        load_sample_data(db_path)
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM schemes")
    
    count = 0
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            scheme_id = str(uuid.uuid4())[:8]
            
            cursor.execute("""
            INSERT INTO schemes (id, scheme_name, state, state_code, level, category, 
                               eligibility, benefits, application_process, documents_required, official_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                scheme_id,
                row.get('scheme_name', ''),
                row.get('state', ''),
                row.get('state_code', ''),
                row.get('level', 'State'),
                row.get('category', ''),
                row.get('eligibility', ''),
                row.get('benefits', ''),
                row.get('application_process', ''),
                row.get('documents_required', ''),
                row.get('official_link', ''),
            ))
            count += 1
    
    conn.commit()
    conn.close()
    print(f"✅ Loaded {count} schemes from {csv_path}")


def load_sample_data(db_path: str = "sahayak.db"):
    """Load sample scheme data for demo purposes."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing
    cursor.execute("DELETE FROM schemes")
    
    sample_schemes = [
        {
            "id": "1",
            "scheme_name": "PM Kisan Samman Nidhi",
            "state": "All India",
            "state_code": "ALL",
            "level": "Central",
            "category": "Agriculture",
            "eligibility": "All land-holding farmer families. Excludes institutional land holders and income tax payers.",
            "benefits": "₹6,000 per year in three installments of ₹2,000 each directly to bank account.",
            "application_process": "1. Visit nearest CSC or agriculture office\n2. Carry Aadhaar, land docs, bank passbook\n3. Fill PM-Kisan form\n4. Submit with documents\n5. Verification by state officials\n6. Amount credited after approval",
            "documents_required": "Aadhaar Card, Land ownership documents, Bank passbook",
            "official_link": "https://pmkisan.gov.in/",
        },
        {
            "id": "2",
            "scheme_name": "Ayushman Bharat - PMJAY",
            "state": "All India",
            "state_code": "ALL",
            "level": "Central",
            "category": "Healthcare",
            "eligibility": "Families from SECC 2011 data. Covers 10.74 crore poor and vulnerable families.",
            "benefits": "Health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.",
            "application_process": "1. Check eligibility on pmjay.gov.in\n2. Visit empanelled hospital or CSC\n3. Carry Aadhaar or ration card\n4. Get e-card generated\n5. Use for cashless treatment",
            "documents_required": "Aadhaar Card, Ration Card, SECC 2011 verification",
            "official_link": "https://pmjay.gov.in/",
        },
        {
            "id": "3",
            "scheme_name": "Mukhyamantri Kanya Sumangala Yojana",
            "state": "Uttar Pradesh",
            "state_code": "UP",
            "level": "State",
            "category": "Women & Child",
            "eligibility": "Girl children born in UP after April 2019. Max 2 girls per family. Income below ₹3 lakh.",
            "benefits": "₹15,000 in installments at birth, immunization, school admission, and graduation.",
            "application_process": "1. Apply online at kanya.upsdc.gov.in\n2. Fill form with girl child details\n3. Upload documents\n4. Submit application\n5. Verification by district authorities\n6. Installments to mother's account",
            "documents_required": "Birth Certificate, Aadhaar of parents, Income Certificate, Bank Passbook",
            "official_link": "https://kanya.upsdc.gov.in/",
        },
        {
            "id": "4",
            "scheme_name": "Maharashtra Ladki Bahin Yojana",
            "state": "Maharashtra",
            "state_code": "MH",
            "level": "State",
            "category": "Women",
            "eligibility": "Women aged 21-65 in Maharashtra. Family income below ₹2.5 lakh. Not an income tax payer.",
            "benefits": "Monthly financial assistance of ₹1,500 directly to bank account.",
            "application_process": "1. Visit setu.mahabat.com or Setu Kendra\n2. Fill application form\n3. Submit with Aadhaar, income proof\n4. Verification by tehsil office\n5. Monthly amount credited",
            "documents_required": "Aadhaar Card, Domicile Certificate, Income Certificate, Bank Details",
            "official_link": "https://setu.mahabat.com/",
        },
        {
            "id": "5",
            "scheme_name": "Delhi Free Electricity Scheme",
            "state": "Delhi",
            "state_code": "DL",
            "level": "State",
            "category": "Utilities",
            "eligibility": "Delhi residents with electricity consumption up to 200 units per month.",
            "benefits": "Complete subsidy on electricity bills for consumption up to 200 units per month.",
            "application_process": "1. Ensure valid electricity connection\n2. Apply on Delhi govt portal\n3. Submit Aadhaar and bill copy\n4. Verification by electricity dept\n5. Subsidy adjusted in next bill",
            "documents_required": "Aadhaar Card, Electricity Bill, Voter ID",
            "official_link": "https://delhi.gov.in/",
        },
        {
            "id": "6",
            "scheme_name": "Karnataka Gruha Jyothi",
            "state": "Karnataka",
            "state_code": "KA",
            "level": "State",
            "category": "Utilities",
            "eligibility": "All Karnataka households with consumption up to 200 units per month.",
            "benefits": "Free electricity up to 200 units per month for domestic consumers.",
            "application_process": "1. Register on sevasindhugs.karnataka.gov.in\n2. Enter consumer number and Aadhaar\n3. Verify details\n4. Submit application\n5. Benefit from next billing cycle",
            "documents_required": "Aadhaar Card, Electricity Consumer Number, Mobile Number",
            "official_link": "https://sevasindhugs.karnataka.gov.in/",
        },
        {
            "id": "7",
            "scheme_name": "PM Awas Yojana - Urban",
            "state": "All India",
            "state_code": "ALL",
            "level": "Central",
            "category": "Housing",
            "eligibility": "Urban EWS/LIG households without pucca house. Priority to SC/ST, minorities, widows.",
            "benefits": "Central assistance of ₹1.5 lakh per house. Interest subsidy of 6.5% on home loans.",
            "application_process": "1. Check eligibility on pmaymis.gov.in\n2. Apply through bank or online\n3. Submit documents\n4. Verification by urban local body\n5. Sanction letter issued\n6. Construction with staged fund release",
            "documents_required": "Aadhaar Card, Income Certificate, Affidavit, Bank Statement",
            "official_link": "https://pmaymis.gov.in/",
        },
        {
            "id": "8",
            "scheme_name": "National Scholarship Portal - Post Matric",
            "state": "All India",
            "state_code": "ALL",
            "level": "Central",
            "category": "Education",
            "eligibility": "SC/ST/OBC/minority students with family income below ₹8 lakh. Studying in recognized institution.",
            "benefits": "Full tuition fee waiver, maintenance allowance ₹1,000-1,200/month, book grants.",
            "application_process": "1. Register on scholarships.gov.in\n2. Fill application form\n3. Upload documents\n4. Submit through institute\n5. Scholarship credited to bank",
            "documents_required": "Aadhaar, Income Certificate, Caste Certificate, Marks Sheet, Bank Passbook",
            "official_link": "https://scholarships.gov.in/",
        },
        {
            "id": "9",
            "scheme_name": "Rajasthan Chiranjeevi Swasthya Bima",
            "state": "Rajasthan",
            "state_code": "RJ",
            "level": "State",
            "category": "Healthcare",
            "eligibility": "All families in Rajasthan. Universal coverage regardless of income.",
            "benefits": "Cashless health insurance of ₹25 lakh per family per year. 1,577 packages covered.",
            "application_process": "1. Visit e-Mitra center or hospital\n2. Carry family Aadhaar cards\n3. Generate Chiranjeevi card\n4. Use for cashless treatment",
            "documents_required": "Aadhaar Card (all members), Chiranjeevi Card, Ration Card",
            "official_link": "https://chiranjeevi.rajasthan.gov.in/",
        },
        {
            "id": "10",
            "scheme_name": "Gujarat Vahali Dikri Yojana",
            "state": "Gujarat",
            "state_code": "GJ",
            "level": "State",
            "category": "Women & Child",
            "eligibility": "Girl children born in Gujarat after Aug 2019. Max 2 girls per family.",
            "benefits": "₹4,000 at Std 1, ₹6,000 at Std 9, ₹1,00,000 at age 18 for education/marriage.",
            "application_process": "1. Apply at Anganwadi/ICDS office\n2. Submit birth certificate and docs\n3. Verified by child development officer\n4. Benefits at each milestone",
            "documents_required": "Birth Certificate, Parents Aadhaar, Income Certificate, Ration Card",
            "official_link": "https://wcd.gujarat.gov.in/",
        },
    ]
    
    for scheme in sample_schemes:
        cursor.execute("""
        INSERT INTO schemes (id, scheme_name, state, state_code, level, category,
                           eligibility, benefits, application_process, documents_required, official_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tuple(scheme.values()))
    
    conn.commit()
    conn.close()
    print(f"✅ Loaded {len(sample_schemes)} sample schemes")


if __name__ == "__main__":
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sahayak.db")
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "schemes.csv")
    
    print("🚀 Sahayak - Loading schemes into database...")
    create_tables(db_path)
    load_from_csv(csv_path, db_path)
    print("✅ Done!")
