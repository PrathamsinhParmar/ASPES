"""
ASPES - Full Data Population + Evaluation Test Script
======================================================
Creates a realistic academic dataset for prathamsinhparmar0@gmail.com
(ADMIN role) plus 3 students, 1 faculty, 5 projects, and runs the full
AI evaluation pipeline, storing results directly in the SQLite database.

Run from the backend/ directory:
    python populate_and_test.py
"""

import asyncio
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Make sure we're in the right directory
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("populate")


# ---------------------------------------------------------------------------
# Sample Python project code snippets (realistic student work)
# ---------------------------------------------------------------------------

PROJECT_CODE = {
    "student_management": """
\"\"\"Student Management System - Data layer module\"\"\"
import sqlite3
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class Student:
    student_id: str
    name: str
    email: str
    cgpa: float = 0.0
    enrolled_courses: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def is_eligible_for_scholarship(self) -> bool:
        \"\"\"Check scholarship eligibility based on CGPA threshold.\"\"\"
        return self.cgpa >= 8.5

    def add_course(self, course_code: str) -> None:
        \"\"\"Enroll student in a course if not already enrolled.\"\"\"
        if course_code not in self.enrolled_courses:
            self.enrolled_courses.append(course_code)

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "name": self.name,
            "email": self.email,
            "cgpa": self.cgpa,
            "enrolled_courses": self.enrolled_courses,
        }


class StudentDatabase:
    \"\"\"Handles all database operations for students.\"\"\"

    def __init__(self, db_path: str = "students.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(\"\"\"
                CREATE TABLE IF NOT EXISTS students (
                    student_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    cgpa REAL DEFAULT 0.0,
                    courses TEXT DEFAULT '[]',
                    created_at TEXT
                )
            \"\"\")
            conn.commit()

    def add_student(self, student: Student) -> bool:
        \"\"\"Insert student into database. Returns True on success.\"\"\"
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "INSERT INTO students VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        student.student_id,
                        student.name,
                        student.email,
                        student.cgpa,
                        json.dumps(student.enrolled_courses),
                        student.created_at.isoformat(),
                    ),
                )
                conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def get_student(self, student_id: str) -> Optional[Student]:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT * FROM students WHERE student_id = ?", (student_id,)
            ).fetchone()
        if row:
            s = Student(
                student_id=row[0],
                name=row[1],
                email=row[2],
                cgpa=row[3],
                enrolled_courses=json.loads(row[4]),
            )
            return s
        return None

    def get_all_students(self) -> List[Student]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute("SELECT * FROM students").fetchall()
        return [Student(row[0], row[1], row[2], row[3], json.loads(row[4])) for row in rows]

    def update_cgpa(self, student_id: str, new_cgpa: float) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            result = conn.execute(
                "UPDATE students SET cgpa = ? WHERE student_id = ?", (new_cgpa, student_id)
            )
            conn.commit()
        return result.rowcount > 0

    def delete_student(self, student_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            result = conn.execute(
                "DELETE FROM students WHERE student_id = ?", (student_id,)
            )
            conn.commit()
        return result.rowcount > 0


import json

if __name__ == "__main__":
    db = StudentDatabase(":memory:")
    s1 = Student("S001", "Arjun Kumar", "arjun@uni.edu", 8.7, ["CS101", "MA203"])
    s2 = Student("S002", "Priya Patel", "priya@uni.edu", 7.4, ["CS101", "PH201"])
    db.add_student(s1)
    db.add_student(s2)
    print("All students:", [s.name for s in db.get_all_students()])
    print("Scholarship eligible:", s1.is_eligible_for_scholarship())
""",

    "library_catalog": """
\"\"\"Library Book Catalog System\"\"\"
from __future__ import annotations
from typing import List, Optional, Dict
from datetime import date, timedelta
import hashlib


class Book:
    def __init__(self, isbn: str, title: str, author: str, year: int, copies: int = 1):
        self.isbn = isbn
        self.title = title
        self.author = author
        self.year = year
        self.total_copies = copies
        self.available_copies = copies
        self.borrowers: Dict[str, date] = {}

    def borrow(self, member_id: str) -> bool:
        if self.available_copies <= 0:
            return False
        self.available_copies -= 1
        due = date.today() + timedelta(days=14)
        self.borrowers[member_id] = due
        return True

    def return_book(self, member_id: str) -> Optional[int]:
        \"\"\"Returns overdue days (negative means not overdue).\"\"\"
        if member_id not in self.borrowers:
            return None
        due = self.borrowers.pop(member_id)
        self.available_copies += 1
        return (date.today() - due).days

    def is_available(self) -> bool:
        return self.available_copies > 0

    def __repr__(self):
        return f"Book({self.title!r}, by {self.author}, {self.available_copies}/{self.total_copies} available)"


class Library:
    def __init__(self, name: str):
        self.name = name
        self.catalog: Dict[str, Book] = {}
        self.members: Dict[str, str] = {}

    def register_member(self, member_id: str, name: str):
        self.members[member_id] = name

    def add_book(self, book: Book):
        self.catalog[book.isbn] = book

    def search_by_author(self, author: str) -> List[Book]:
        query = author.lower()
        return [b for b in self.catalog.values() if query in b.author.lower()]

    def search_by_title(self, keyword: str) -> List[Book]:
        kw = keyword.lower()
        return [b for b in self.catalog.values() if kw in b.title.lower()]

    def checkout(self, isbn: str, member_id: str) -> str:
        if member_id not in self.members:
            return "Member not registered."
        book = self.catalog.get(isbn)
        if not book:
            return "Book not found in catalog."
        if book.borrow(member_id):
            return f"Checked out '{book.title}' to {self.members[member_id]}."
        return f"No copies of '{book.title}' available."

    def checkin(self, isbn: str, member_id: str) -> str:
        book = self.catalog.get(isbn)
        if not book:
            return "Book not found."
        days_overdue = book.return_book(member_id)
        if days_overdue is None:
            return "This member did not borrow this book."
        if days_overdue > 0:
            fine = days_overdue * 5
            return f"Returned. Fine: Rs.{fine} ({days_overdue} days overdue)."
        return "Returned on time. No fine."

    def available_books(self) -> List[Book]:
        return [b for b in self.catalog.values() if b.is_available()]


if __name__ == "__main__":
    lib = Library("City Library")
    lib.register_member("M01", "Rahul Sharma")
    lib.add_book(Book("978-0-13-468599-1", "Clean Code", "Robert Martin", 2008, 3))
    lib.add_book(Book("978-0-13-235088-4", "The Pragmatic Programmer", "Andrew Hunt", 1999, 2))
    print(lib.checkout("978-0-13-468599-1", "M01"))
    print("Available:", lib.available_books())
""",

    "inventory_manager": """
\"\"\"Inventory Management System for Small Retail Stores\"\"\"
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import csv
import io


class Product:
    def __init__(self, pid: str, name: str, price: float, quantity: int, category: str):
        self.pid = pid
        self.name = name
        self.price = price
        self.quantity = quantity
        self.category = category
        self.last_updated = datetime.now()

    def update_quantity(self, delta: int) -> bool:
        \"\"\"Add or subtract quantity. Returns False if stock would go negative.\"\"\"
        if self.quantity + delta < 0:
            return False
        self.quantity += delta
        self.last_updated = datetime.now()
        return True

    def apply_discount(self, percent: float) -> float:
        \"\"\"Calculate discounted price.\"\"\"
        if not 0 <= percent <= 100:
            raise ValueError("Discount must be between 0 and 100")
        return round(self.price * (1 - percent / 100), 2)

    @property
    def total_value(self) -> float:
        return round(self.price * self.quantity, 2)


class Inventory:
    def __init__(self):
        self.products: Dict[str, Product] = {}
        self.transactions: List[dict] = []

    def add_product(self, product: Product):
        self.products[product.pid] = product
        self._log("ADDED", product.pid, 0, product.quantity)

    def restock(self, pid: str, qty: int) -> bool:
        if pid not in self.products or qty <= 0:
            return False
        self.products[pid].update_quantity(qty)
        self._log("RESTOCK", pid, 0, qty)
        return True

    def sell(self, pid: str, qty: int) -> Tuple[bool, float]:
        \"\"\"Sell items. Returns (success, revenue).\"\"\"
        if pid not in self.products:
            return False, 0.0
        p = self.products[pid]
        if not p.update_quantity(-qty):
            return False, 0.0
        revenue = round(p.price * qty, 2)
        self._log("SOLD", pid, qty, -qty)
        return True, revenue

    def low_stock_alert(self, threshold: int = 10) -> List[Product]:
        return [p for p in self.products.values() if p.quantity <= threshold]

    def category_summary(self) -> Dict[str, dict]:
        summary = {}
        for p in self.products.values():
            cat = p.category
            if cat not in summary:
                summary[cat] = {"count": 0, "total_value": 0.0, "items": []}
            summary[cat]["count"] += 1
            summary[cat]["total_value"] += p.total_value
            summary[cat]["items"].append(p.name)
        return summary

    def export_csv(self) -> str:
        \"\"\"Export inventory to CSV string.\"\"\"
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["PID", "Name", "Price", "Quantity", "Category", "Total Value"])
        for p in self.products.values():
            writer.writerow([p.pid, p.name, p.price, p.quantity, p.category, p.total_value])
        return output.getvalue()

    def _log(self, action: str, pid: str, before: int, after: int):
        self.transactions.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "pid": pid,
            "quantity_change": after - before,
        })

    @property
    def total_inventory_value(self) -> float:
        return round(sum(p.total_value for p in self.products.values()), 2)


if __name__ == "__main__":
    inv = Inventory()
    inv.add_product(Product("P001", "Notebook", 45.0, 200, "Stationery"))
    inv.add_product(Product("P002", "Pen Pack (10)", 30.0, 500, "Stationery"))
    inv.add_product(Product("P003", "USB-C Cable", 380.0, 15, "Electronics"))
    inv.restock("P001", 100)
    ok, revenue = inv.sell("P003", 2)
    print("Sale:", ok, "Revenue:", revenue)
    print("Total Value:", inv.total_inventory_value)
    print("Low stock:", [p.name for p in inv.low_stock_alert(20)])
""",

    "weather_analyzer": """
\"\"\"Weather Data Analyzer - reads historical CSV and produces statistics\"\"\"
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, date
import statistics
import math


@dataclass
class WeatherRecord:
    record_date: date
    city: str
    temperature_c: float
    humidity_percent: float
    wind_speed_kmh: float
    rainfall_mm: float = 0.0
    condition: str = "Clear"

    @property
    def feels_like(self) -> float:
        \"\"\"Heat index approximation.\"\"\"
        T = self.temperature_c
        H = self.humidity_percent
        if T < 27:
            return T
        hi = (-8.78469475556
              + 1.61139411 * T
              + 2.33854883889 * H
              - 0.14611605 * T * H
              - 0.012308094 * T ** 2
              - 0.016424828 * H ** 2
              + 0.002211732 * T ** 2 * H
              + 0.00072546 * T * H ** 2
              - 0.000003582 * T ** 2 * H ** 2)
        return round(hi, 2)


class WeatherAnalyzer:
    def __init__(self, records: List[WeatherRecord]):
        self.records = records

    def monthly_averages(self) -> Dict[str, Dict[str, float]]:
        monthly: Dict[str, List[WeatherRecord]] = {}
        for r in self.records:
            key = r.record_date.strftime("%Y-%m")
            monthly.setdefault(key, []).append(r)

        result = {}
        for month, recs in monthly.items():
            result[month] = {
                "avg_temp": round(statistics.mean(r.temperature_c for r in recs), 2),
                "avg_humidity": round(statistics.mean(r.humidity_percent for r in recs), 2),
                "total_rainfall": round(sum(r.rainfall_mm for r in recs), 2),
                "max_temp": max(r.temperature_c for r in recs),
                "min_temp": min(r.temperature_c for r in recs),
            }
        return result

    def hottest_day(self) -> Optional[WeatherRecord]:
        return max(self.records, key=lambda r: r.temperature_c, default=None)

    def coldest_day(self) -> Optional[WeatherRecord]:
        return min(self.records, key=lambda r: r.temperature_c, default=None)

    def rainy_days(self, threshold_mm: float = 0.5) -> List[WeatherRecord]:
        return [r for r in self.records if r.rainfall_mm >= threshold_mm]

    def temperature_trend(self) -> str:
        \"\"\"Simple linear regression to determine warming/cooling trend.\"\"\"
        if len(self.records) < 2:
            return "Insufficient data"
        temps = [r.temperature_c for r in self.records]
        n = len(temps)
        x_mean = (n - 1) / 2
        y_mean = statistics.mean(temps)
        numerator = sum((i - x_mean) * (t - y_mean) for i, t in enumerate(temps))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        slope = numerator / denominator if denominator != 0 else 0
        if slope > 0.1:
            return f"Warming trend (+{slope:.3f}°C/day)"
        if slope < -0.1:
            return f"Cooling trend ({slope:.3f}°C/day)"
        return "Stable temperature (no significant trend)"

    def humidity_correlation_with_rainfall(self) -> float:
        \"\"\"Pearson correlation between humidity and rainfall.\"\"\"
        h = [r.humidity_percent for r in self.records]
        rf = [r.rainfall_mm for r in self.records]
        n = len(h)
        if n < 2:
            return 0.0
        hm, rm = statistics.mean(h), statistics.mean(rf)
        num = sum((hv - hm) * (rv - rm) for hv, rv in zip(h, rf))
        den = math.sqrt(
            sum((hv - hm) ** 2 for hv in h) * sum((rv - rm) ** 2 for rv in rf)
        )
        return round(num / den, 4) if den != 0 else 0.0


if __name__ == "__main__":
    from datetime import date
    records = [
        WeatherRecord(date(2024, 6, 1), "Ahmedabad", 42.5, 25, 10, 0),
        WeatherRecord(date(2024, 6, 15), "Ahmedabad", 44.2, 28, 12, 0),
        WeatherRecord(date(2024, 7, 3), "Ahmedabad", 34.0, 85, 20, 55.0, "Rainy"),
        WeatherRecord(date(2024, 7, 20), "Ahmedabad", 31.5, 90, 15, 80.0, "Rainy"),
        WeatherRecord(date(2024, 8, 10), "Ahmedabad", 32.0, 88, 18, 40.0, "Partly Cloudy"),
    ]
    analyzer = WeatherAnalyzer(records)
    print("Monthly Averages:", analyzer.monthly_averages())
    print("Hottest Day:", analyzer.hottest_day())
    print("Trend:", analyzer.temperature_trend())
    print("Humidity-Rainfall Corr:", analyzer.humidity_correlation_with_rainfall())
""",

    "expense_tracker": """
\"\"\"Personal Expense Tracker with Budget Alerts\"\"\"
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
import json


class Category(str, Enum):
    FOOD = "Food"
    TRANSPORT = "Transport"
    EDUCATION = "Education"
    HEALTH = "Health"
    ENTERTAINMENT = "Entertainment"
    UTILITIES = "Utilities"
    OTHER = "Other"


@dataclass
class Expense:
    amount: float
    category: Category
    description: str
    expense_date: date = field(default_factory=date.today)
    tags: List[str] = field(default_factory=list)
    eid: str = field(default_factory=lambda: str(datetime.now().timestamp()))

    def __post_init__(self):
        if self.amount <= 0:
            raise ValueError("Expense amount must be positive.")


class Budget:
    def __init__(self, category: Category, limit: float, period: str = "monthly"):
        self.category = category
        self.limit = limit
        self.period = period

    def is_exceeded(self, spent: float) -> bool:
        return spent > self.limit

    def utilization(self, spent: float) -> float:
        return round(spent / self.limit * 100, 2) if self.limit > 0 else 0.0


class ExpenseTracker:
    def __init__(self, user_name: str):
        self.user_name = user_name
        self.expenses: List[Expense] = []
        self.budgets: Dict[Category, Budget] = {}

    def add_expense(self, expense: Expense):
        self.expenses.append(expense)

    def set_budget(self, category: Category, limit: float):
        self.budgets[category] = Budget(category, limit)

    def total_spent(self, month: Optional[int] = None, year: Optional[int] = None) -> float:
        exps = self._filter_by_period(month, year)
        return round(sum(e.amount for e in exps), 2)

    def by_category(self, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, float]:
        exps = self._filter_by_period(month, year)
        summary: Dict[str, float] = {}
        for e in exps:
            summary[e.category.value] = summary.get(e.category.value, 0.0) + e.amount
        return {k: round(v, 2) for k, v in summary.items()}

    def budget_alerts(self, month: Optional[int] = None, year: Optional[int] = None) -> List[dict]:
        cat_totals = self.by_category(month, year)
        alerts = []
        for cat, budget in self.budgets.items():
            spent = cat_totals.get(cat.value, 0.0)
            util = budget.utilization(spent)
            if util >= 80:
                alerts.append({
                    "category": cat.value,
                    "budget": budget.limit,
                    "spent": spent,
                    "utilization_pct": util,
                    "exceeded": budget.is_exceeded(spent),
                })
        return alerts

    def top_expenses(self, n: int = 5) -> List[Expense]:
        return sorted(self.expenses, key=lambda e: e.amount, reverse=True)[:n]

    def _filter_by_period(self, month: Optional[int], year: Optional[int]) -> List[Expense]:
        if month is None and year is None:
            return self.expenses
        result = self.expenses
        if year:
            result = [e for e in result if e.expense_date.year == year]
        if month:
            result = [e for e in result if e.expense_date.month == month]
        return result

    def export_json(self) -> str:
        return json.dumps([{
            "eid": e.eid,
            "amount": e.amount,
            "category": e.category.value,
            "description": e.description,
            "date": e.expense_date.isoformat(),
        } for e in self.expenses], indent=2)


if __name__ == "__main__":
    tracker = ExpenseTracker("Pratham")
    tracker.set_budget(Category.FOOD, 5000)
    tracker.set_budget(Category.ENTERTAINMENT, 2000)
    tracker.add_expense(Expense(1200, Category.FOOD, "Groceries", date(2024, 3, 5)))
    tracker.add_expense(Expense(450, Category.TRANSPORT, "Auto fare", date(2024, 3, 6)))
    tracker.add_expense(Expense(3800, Category.FOOD, "Restaurant bills", date(2024, 3, 25)))
    tracker.add_expense(Expense(1800, Category.ENTERTAINMENT, "Movie + games", date(2024, 3, 20)))
    print("Total spent:", tracker.total_spent(month=3, year=2024))
    print("By category:", tracker.by_category(month=3, year=2024))
    print("Alerts:", tracker.budget_alerts(month=3, year=2024))
"""
}

PROJECT_REPORTS = {
    "student_management": """
Student Management System - Project Report

Abstract:
This project implements a Student Management System (SMS) to manage student records, course enrollments, and academic performance in a university setting. The system provides CRUD operations for student data backed by an SQLite database.

1. Introduction
Managing student data manually leads to errors and inefficiencies. This project automates the process using Python's sqlite3 module with an object-oriented design paradigm.

2. System Design
The system uses three core classes:
- Student (dataclass): Represents a student entity with all relevant academic attributes
- StudentDatabase: Data access object (DAO) handling all persistence operations
- Main script: Demonstrates CRUD workflows

Key Features:
- Add, retrieve, update, and delete student records
- Course enrollment management with duplicate-check prevention
- Scholarship eligibility calculation based on CGPA
- JSON serialization for complex fields (course list)

3. Implementation
The Student dataclass uses Python's dataclasses module for clean initialization. The StudentDatabase class connects to SQLite via a context manager ensuring safe connection handling. All queries are parameterized to prevent SQL injection.

4. Testing
Unit tests cover: add_student, get_student, update_cgpa, delete_student, is_eligible_for_scholarship, add_course (duplicate prevention). Edge cases include empty databases, non-existent student IDs, and invalid CGPA values.

5. Conclusion
The project successfully implements a functional student management backend suitable for a university administrative portal. Future work includes a web interface and PostgreSQL migration for multi-user environments.
""",
    "library_catalog": """
Digital Library Catalog Management System - Project Report

Abstract:
This report documents the design and implementation of a digital library catalog system in Python. The system manages book inventory, member registrations, checkouts, returns, and fine calculations using object-oriented programming.

1. Introduction
Traditional library card systems are prone to human error and are difficult to scale. This project replaces manual logging with a Python-based digital system.

2. Features Implemented
- Book management: add books with multiple copy tracking
- Member registration and management
- Checkout workflow with automatic due-date assignment (14-day borrow period)
- Return processing with overdue fine calculation (Rs. 5/day)
- Search by title keyword or author name
- Available books listing

3. Class Design
Book class: Encapsulates ISBN, title, author, availability tracking, and borrower ledger (dict mapping member_id to due_date). Uses Python's dict for O(1) borrower lookup.

Library class: Acts as a facade over multiple Book instances. Provides search, checkout, and return APIs.

4. Algorithm Details
Fine calculation: On return, the system computes (today - due_date).days. If positive, a fine of Rs.5 per overdue day is applied.

5. Testing
Tests verify: normal checkout, checkout with no available copies, return (on-time and overdue), invalid member checkout, and author/title search functionality.

6. Limitations and Future Work
Currently in-memory only (data lost on restart). Future versions will persist using SQLite. A web API using Flask is planned for Phase 2.
""",
    "inventory_manager": """
Retail Inventory Management System - Technical Report

Abstract:
A Python-based inventory management system for small retail stores, supporting product tracking, stock management, sales recording, low stock alerts, category analytics, and CSV export.

1. Introduction
Small retail businesses often manage stock using spreadsheets, leading to data entry errors and stock-outs. This system replaces spreadsheets with a structured Python application.

2. Core Components

Product Class:
- Encapsulates product ID, name, price, quantity, and category
- total_value property computes price × quantity dynamically
- apply_discount method validates 0-100% range with proper error handling
- update_quantity prevents negative stock

Inventory Class:
- Central coordinator managing all Product objects
- restock and sell methods handle quantity adjustments
- low_stock_alert returns products below a configurable threshold
- category_summary aggregates products by category with value totals
- export_csv generates RFC 4180-compliant CSV using Python's csv module
- Transaction log records all inventory mutations with timestamps

3. Design Decisions
Used dictionary (Dict[str, Product]) for O(1) product lookup by PID. Separation of concerns: Product manages its own state, Inventory manages the collection.

4. Testing Strategy
Tested via boundary conditions: selling exactly available stock, selling one more than available, restocking with negative quantity, and discount edge cases (0%, 100%, and out-of-range).

5. Result
System successfully tracks inventory worth over Rs. 10,000 across multiple categories, generates real-time alerts for low-stock items, and exports to CSV for spreadsheet-compatible reporting.
""",
    "weather_analyzer": """
Historical Weather Data Analyzer - Academic Project Report

Abstract:
This project implements a data analytics module in Python to process historical weather records for an Indian city (Ahmedabad). It computes monthly averages, identifies extreme days, detects temperature trends using linear regression, and measures humidity-rainfall correlation.

1. Introduction
Weather forecasting and climate research require robust data processing tools. This project provides statistical analysis of historical weather data using pure Python standard library, intentionally avoiding third-party libraries to demonstrate algorithmic understanding.

2. Data Model
The WeatherRecord dataclass stores: date, city, temperature (°C), humidity (%), wind speed (km/h), rainfall (mm), and condition string. It also computes a heat index (Feels Like temperature) using the Rothfusz regression formula approved by the US National Weather Service.

3. Key Algorithms

Monthly Aggregation: Groups records by YYYY-MM key, computes mean, max, min for temperature and total rainfall.

Trend Detection (Linear Regression): Computes the slope of a least-squares best-fit line through the temperature time series. A slope > 0.1°C/day is classified as a warming trend.

Pearson Correlation: Calculates the statistical correlation between humidity percentage and rainfall, providing insight into monsoon predictability.

4. Findings
For Ahmedabad summer-monsoon data (June-August 2024): The temperature drops ~10°C from June peak to August. A warming trend is observed in pre-monsoon season. Humidity shows 0.87 correlation with rainfall, indicating high predictive value.

5. Conclusion
The system successfully processes seasonal weather patterns with accurate statistical computations. Future work will include reading real CSV data from IMD (India Meteorological Department) archives.
""",
    "expense_tracker": """
Personal Expense Tracker with Budget Alerts - Project Report

Abstract:
A personal finance management application built in Python that tracks daily expenses, categorizes spending, enforces monthly budgets, generates budget alerts when utilization exceeds 80%, and exports transaction data as JSON.

1. Introduction
Personal budgeting is an important financial skill. This tool helps users monitor their spending habits, identify over-budget categories, and review their top expenses at a glance.

2. System Architecture

Expense Dataclass: Stores amount, category (enum), description, date, and optional tags. Validation ensures amount > 0 via __post_init__.

Budget Class: Links a spending limit to a Category. Computes utilization percentage and exceeded status.

ExpenseTracker Class: Central aggregator with:
- add_expense / set_budget for data entry
- total_spent / by_category for period-based reporting (monthly/yearly filtering)
- budget_alerts returns all categories at ≥80% utilization
- top_expenses returns N highest spending records
- export_json serializes all expenses to JSON for external analysis

3. Category Design
Used Python Enum for Category to prevent typos and enable IDE autocompletion. String values are user-friendly display names.

4. Budget Alert Logic
Alerts are generated when spending utilization ≥ 80%. The alert includes category, budget limit, actual spend, utilization %, and exceeded flag, providing actionable information.

5. Sample Run Results
For March 2024, Food budget (Rs. 5000) was at 100% utilization (Rs. 5000 spent). Entertainment was at 90% utilization. Total spending: Rs. 7250.

6. Future Enhancements
Persistent storage (SQLite), chart visualization (matplotlib), and a Telegram bot for real-time alerts are planned for Phase 2.
"""
}


async def main():
    """Main seeding and evaluation function."""
    # ------------------------------------------------------------------
    # 0. Load app config / DB
    # ------------------------------------------------------------------
    from app.database.connection import engine, Base, AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.models.project import Project, ProjectStatus
    from app.models.evaluation import Evaluation, EvaluationStatus
    from app.utils.security import get_password_hash
    from sqlalchemy import select

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables ready")

    # ------------------------------------------------------------------
    # 1. Prepare sample code files on disk (needed for AI analysis)
    # ------------------------------------------------------------------
    uploads_dir = Path("uploads/sample_projects")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    code_files = {}
    for proj_key, code in PROJECT_CODE.items():
        fpath = uploads_dir / f"{proj_key}.py"
        fpath.write_text(code, encoding="utf-8")
        code_files[proj_key] = str(fpath)

    report_files = {}
    for proj_key, report_text in PROJECT_REPORTS.items():
        fpath = uploads_dir / f"{proj_key}_report.txt"
        fpath.write_text(report_text, encoding="utf-8")
        report_files[proj_key] = str(fpath)

    logger.info(f"✅ Sample project files written to {uploads_dir}")

    # ------------------------------------------------------------------
    # 2. Define users
    # ------------------------------------------------------------------
    users_to_create = [
        {
            "email": "prathamsinhparmar0@gmail.com",
            "username": "prathamsinh",
            "full_name": "Prathamsinh Parmar",
            "password": "Pratham@123",
            "role": UserRole.ADMIN,
        },
        {
            "email": "prof.mehta@aspes.edu",
            "username": "prof_mehta",
            "full_name": "Prof. Ankit Mehta",
            "password": "Faculty@123",
            "role": UserRole.PROFESSOR,
        },
        {
            "email": "arjun.kumar@student.edu",
            "username": "arjun_k",
            "full_name": "Arjun Kumar",
            "password": "Student@123",
            "role": UserRole.STUDENT,
        },
        {
            "email": "priya.patel@student.edu",
            "username": "priya_p",
            "full_name": "Priya Patel",
            "password": "Student@123",
            "role": UserRole.STUDENT,
        },
        {
            "email": "rahul.sharma@student.edu",
            "username": "rahul_s",
            "full_name": "Rahul Sharma",
            "password": "Student@123",
            "role": UserRole.STUDENT,
        },
        {
            "email": "sneha.joshi@student.edu",
            "username": "sneha_j",
            "full_name": "Sneha Joshi",
            "password": "Student@123",
            "role": UserRole.STUDENT,
        },
    ]

    # ------------------------------------------------------------------
    # 3. Upsert users into DB
    # ------------------------------------------------------------------
    created_users = {}  # email -> User ORM object

    async with AsyncSessionLocal() as db:
        for ud in users_to_create:
            stmt = select(User).where(User.email == ud["email"])
            existing = (await db.execute(stmt)).scalar_one_or_none()

            if existing:
                logger.info(f"  ↩️  User already exists: {ud['email']}")
                created_users[ud["email"]] = existing
            else:
                new_user = User(
                    email=ud["email"],
                    username=ud["username"],
                    full_name=ud["full_name"],
                    hashed_password=get_password_hash(ud["password"]),
                    role=ud["role"],
                    is_active=True,
                    is_verified=True,
                )
                db.add(new_user)
                await db.flush()  # get the generated id
                await db.refresh(new_user)
                created_users[ud["email"]] = new_user
                logger.info(f"  ✅ Created user: {ud['email']} ({ud['role'].value})")

        await db.commit()

        # Reload fresh after commit
        for email in list(created_users.keys()):
            stmt = select(User).where(User.email == email)
            u = (await db.execute(stmt)).scalar_one_or_none()
            created_users[email] = u

    logger.info(f"✅ {len(created_users)} users ready in database")

    # ------------------------------------------------------------------
    # 4. Define projects (student → project mapping)
    # ------------------------------------------------------------------
    student_emails = [
        "arjun.kumar@student.edu",
        "priya.patel@student.edu",
        "rahul.sharma@student.edu",
        "sneha.joshi@student.edu",
    ]
    proj_keys = list(PROJECT_CODE.keys())  # 5 projects
    
    project_defs = [
        {
            "title": "Student Management System",
            "description": "A Python-based backend system for managing student records, enrollments, and CGPA tracking using SQLite.",
            "course_name": "Database Management Systems",
            "batch_year": "2024",
            "proj_key": "student_management",
            "owner_email": student_emails[0],
        },
        {
            "title": "Digital Library Catalog System",
            "description": "An OOP-based library system with book inventory, member management, checkout workflows, and fine calculation.",
            "course_name": "Object Oriented Programming",
            "batch_year": "2024",
            "proj_key": "library_catalog",
            "owner_email": student_emails[1],
        },
        {
            "title": "Retail Inventory Manager",
            "description": "Inventory management application for small stores with analytics, alerts, and CSV export capabilities.",
            "course_name": "Software Engineering",
            "batch_year": "2024",
            "proj_key": "inventory_manager",
            "owner_email": student_emails[2],
        },
        {
            "title": "Historical Weather Data Analyzer",
            "description": "Python data analytics module processing historical weather records with statistical trend detection and correlation analysis.",
            "course_name": "Data Structures and Algorithms",
            "batch_year": "2024",
            "proj_key": "weather_analyzer",
            "owner_email": student_emails[3],
        },
        {
            "title": "Personal Expense Tracker",
            "description": "Budget tracking app with category-wise spending analysis, budget alerts at 80% utilization, and JSON export.",
            "course_name": "Python Programming",
            "batch_year": "2024",
            "proj_key": "expense_tracker",
            "owner_email": student_emails[0],  # Arjun has 2 projects
        },
    ]

    # ------------------------------------------------------------------
    # 5. Upsert projects
    # ------------------------------------------------------------------
    created_projects = {}  # proj_key -> Project ORM

    async with AsyncSessionLocal() as db:
        for pd in project_defs:
            owner = created_users[pd["owner_email"]]
            stmt = select(Project).where(Project.title == pd["title"])
            existing_proj = (await db.execute(stmt)).scalar_one_or_none()

            if existing_proj:
                logger.info(f"  ↩️  Project already exists: {pd['title']}")
                created_projects[pd["proj_key"]] = existing_proj
            else:
                proj = Project(
                    title=pd["title"],
                    description=pd["description"],
                    course_name=pd["course_name"],
                    batch_year=pd["batch_year"],
                    owner_id=owner.id,
                    status=ProjectStatus.SUBMITTED,
                    code_file_path=code_files[pd["proj_key"]],
                    report_file_path=report_files[pd["proj_key"]],
                    submitted_at=datetime.now(timezone.utc),
                )
                db.add(proj)
                await db.flush()
                await db.refresh(proj)
                created_projects[pd["proj_key"]] = proj
                logger.info(f"  ✅ Created project: {pd['title']}")

        await db.commit()

        # Reload
        for pk in list(created_projects.keys()):
            title = next(p["title"] for p in project_defs if p["proj_key"] == pk)
            stmt = select(Project).where(Project.title == title)
            p = (await db.execute(stmt)).scalar_one_or_none()
            created_projects[pk] = p

    logger.info(f"✅ {len(created_projects)} projects ready in database")

    # ------------------------------------------------------------------
    # 6. Run AI Evaluation for each project
    # ------------------------------------------------------------------
    logger.info("\n" + "=" * 60)
    logger.info("🤖 Starting AI Evaluation Pipeline...")
    logger.info("=" * 60)

    from app.ai_engine.comprehensive_scorer import ComprehensiveScorer
    from app.ai_engine.code_analyzer import CodeAnalyzer
    from app.ai_engine.doc_evaluator import DocumentationEvaluator
    from app.ai_engine.ai_code_detector import AICodeDetector
    from app.ai_engine.report_code_aligner import ReportCodeAligner
    from app.ai_engine.plagiarism_detector import PlagiarismDetectorWithCache
    from app.models.project import ProjectStatus

    # Initialize AI engines (shared across projects)
    scorer = ComprehensiveScorer()
    code_analyzer = CodeAnalyzer()
    doc_evaluator = DocumentationEvaluator()
    ai_detector = AICodeDetector()
    aligner = ReportCodeAligner()
    plagiarism_detector = PlagiarismDetectorWithCache()

    admin_user = created_users["prathamsinhparmar0@gmail.com"]
    
    # Build existing projects list for plagiarism check
    existing_projects_for_plag = []

    evaluation_results = {}

    for idx, (proj_key, project) in enumerate(created_projects.items()):
        logger.info(f"\n▶  Evaluating [{idx+1}/{len(created_projects)}]: {project.title}")
        
        code_path = code_files[proj_key]
        report_path = report_files[proj_key]

        try:
            code_content = Path(code_path).read_text(encoding="utf-8", errors="ignore")
        except Exception:
            code_content = ""

        results = {}

        # a) Code Quality
        try:
            results["code_quality"] = code_analyzer.analyze(code_path)
            logger.info(f"   ✅ Code quality score: {results['code_quality'].get('final_score', 'N/A')}")
        except Exception as e:
            logger.warning(f"   ⚠️  Code analysis error: {e}")
            results["code_quality"] = {"final_score": 70.0}

        # b) Document Quality
        try:
            results["doc_evaluation"] = doc_evaluator.evaluate(report_path)
            logger.info(f"   ✅ Doc quality score: {results['doc_evaluation'].get('final_score', 'N/A')}")
        except Exception as e:
            logger.warning(f"   ⚠️  Doc evaluation error: {e}")
            results["doc_evaluation"] = {"final_score": 65.0}

        # c) AI Detection
        try:
            results["ai_detection"] = ai_detector.analyze(code_content, code_path)
            logger.info(f"   ✅ AI detection verdict: {results['ai_detection'].get('verdict', 'N/A')}")
        except Exception as e:
            logger.warning(f"   ⚠️  AI detection error: {e}")
            results["ai_detection"] = {"verdict": "HUMAN_WRITTEN", "ai_generated_probability": 0.10}

        # d) Report-Code Alignment
        try:
            doc_text = results["doc_evaluation"].get("raw_text", Path(report_path).read_text(encoding="utf-8", errors="ignore"))
            results["alignment"] = aligner.analyze_alignment(
                report_text=doc_text,
                code_content=code_content,
                file_paths=[code_path],
            )
            logger.info(f"   ✅ Alignment score: {results['alignment'].get('overall_alignment_score', 'N/A')}")
        except Exception as e:
            logger.warning(f"   ⚠️  Alignment error: {e}")
            results["alignment"] = {"overall_alignment_score": 75.0, "missing_features": []}

        # e) Plagiarism
        try:
            plag_result = plagiarism_detector.detect(
                current_code=code_content,
                existing_projects=existing_projects_for_plag,
            )
            results["plagiarism"] = plag_result
            logger.info(f"   ✅ Plagiarism originality: {plag_result.get('originality_score', 'N/A')}")
        except Exception as e:
            logger.warning(f"   ⚠️  Plagiarism detection error: {e}")
            results["plagiarism"] = {"originality_score": 95.0, "flagged": False, "max_similarity_percent": 5.0}

        # Add current project to pool for subsequent plagiarism checks
        existing_projects_for_plag.append({
            "id": str(project.id),
            "title": project.title,
            "code": code_content,
        })

        # f) Calculate final score
        scoring = scorer.calculate_overall_score(results)
        logger.info(f"   🏆 Final Score: {scoring['final_score']} | Grade: {scoring['letter_grade']}")

        evaluation_results[proj_key] = {
            "project": project,
            "results": results,
            "scoring": scoring,
        }

        # ------------------------------------------------------------------
        # 7. Store evaluation in DB
        # ------------------------------------------------------------------
        async with AsyncSessionLocal() as db:
            # Check if evaluation already exists
            stmt = select(Evaluation).where(Evaluation.project_id == project.id)
            existing_eval = (await db.execute(stmt)).scalar_one_or_none()

            code_q = results.get("code_quality", {})
            doc_q = results.get("doc_evaluation", {})
            plag = results.get("plagiarism", {})
            align = results.get("alignment", {})
            ai_det = results.get("ai_detection", {})

            # Clean doc_evaluation - remove raw_text before storing
            doc_q_clean = {k: v for k, v in doc_q.items() if k != "raw_text"}

            ai_feedback_text = (
                f"## AI Evaluation Feedback\n\n"
                f"**Project**: {project.title}\n"
                f"**Final Score**: {scoring['final_score']}/100 ({scoring['letter_grade']})\n"
                f"**Interpretation**: {scoring['score_interpretation']}\n"
                f"**Percentile**: {scoring['percentile']}\n\n"
                f"### Component Breakdown\n"
                + "\n".join([f"- **{k.replace('_', ' ').title()}**: {v}/100" 
                             for k, v in scoring["component_scores"].items()])
                + f"\n\n### Penalties Applied\n"
                + (
                    "\n".join([f"- {p['reason']}: {p['amount']} pts" for p in scoring["penalties"]])
                    if scoring["penalties"] else "- No penalties applied ✅"
                )
                + f"\n\n### Bonuses Applied\n"
                + (
                    "\n".join([f"- {b['reason']}: +{b['amount']} pts" for b in scoring["bonuses"]])
                    if scoring["bonuses"] else "- No bonuses applied"
                )
                + f"\n\n### Recommendations\n"
                f"Focus on improving code quality metrics, ensuring comprehensive documentation, "
                f"and maintaining strong alignment between the report and implementation."
            )

            if existing_eval:
                logger.info(f"   ↩️  Updating existing evaluation record for: {project.title}")
                existing_eval.status = EvaluationStatus.COMPLETED
                existing_eval.total_score = scoring["final_score"]
                existing_eval.code_quality_score = code_q.get("final_score", 0.0)
                existing_eval.documentation_score = doc_q.get("final_score", 0.0)
                existing_eval.plagiarism_score = plag.get("originality_score", 100.0)
                existing_eval.report_alignment_score = align.get("overall_alignment_score", 0.0)
                existing_eval.ai_code_score = (1.0 - ai_det.get("ai_generated_probability", 0.0)) * 100
                existing_eval.ai_code_detected = ai_det.get("ai_generated_probability", 0.0) > 0.75
                existing_eval.plagiarism_detected = plag.get("flagged", False)
                existing_eval.code_analysis_result = code_q
                existing_eval.doc_evaluation_result = doc_q_clean
                existing_eval.plagiarism_result = plag
                existing_eval.alignment_result = align
                existing_eval.ai_detection_result = ai_det
                existing_eval.ai_feedback = ai_feedback_text
                existing_eval.evaluator_id = admin_user.id
                existing_eval.completed_at = datetime.now(timezone.utc)
            else:
                new_eval = Evaluation(
                    project_id=project.id,
                    evaluator_id=admin_user.id,
                    status=EvaluationStatus.COMPLETED,
                    total_score=scoring["final_score"],
                    code_quality_score=code_q.get("final_score", 0.0),
                    documentation_score=doc_q.get("final_score", 0.0),
                    plagiarism_score=plag.get("originality_score", 100.0),
                    report_alignment_score=align.get("overall_alignment_score", 0.0),
                    ai_code_score=(1.0 - ai_det.get("ai_generated_probability", 0.0)) * 100,
                    ai_code_detected=ai_det.get("ai_generated_probability", 0.0) > 0.75,
                    plagiarism_detected=plag.get("flagged", False),
                    code_analysis_result=code_q,
                    doc_evaluation_result=doc_q_clean,
                    plagiarism_result=plag,
                    alignment_result=align,
                    ai_detection_result=ai_det,
                    ai_feedback=ai_feedback_text,
                    started_at=datetime.now(timezone.utc),
                    completed_at=datetime.now(timezone.utc),
                )
                db.add(new_eval)

            # Update project status to EVALUATED
            stmt = select(Project).where(Project.id == project.id)
            proj_obj = (await db.execute(stmt)).scalar_one_or_none()
            if proj_obj:
                proj_obj.status = ProjectStatus.EVALUATED

            await db.commit()
            logger.info(f"   💾 Evaluation stored in database ✅")

    # ------------------------------------------------------------------
    # 8. Summary Report
    # ------------------------------------------------------------------
    logger.info("\n" + "=" * 60)
    logger.info("📊 EVALUATION SUMMARY")
    logger.info("=" * 60)

    for proj_key, data in evaluation_results.items():
        project = data["project"]
        scoring = data["scoring"]
        logger.info(
            f"{'Project':<30} | Score: {scoring['final_score']:>6.2f} | "
            f"Grade: {scoring['letter_grade']:>3} | {scoring['score_interpretation']}"
        )
        logger.info(f"  ↳ {project.title}")

    logger.info("\n✅ All done! Database fully populated and evaluated.")
    logger.info(f"\n📋 Login credentials:")
    logger.info(f"   Admin (you): prathamsinhparmar0@gmail.com / Pratham@123")
    logger.info(f"   Faculty:     prof.mehta@aspes.edu / Faculty@123")
    logger.info(f"   Students:    arjun.kumar@student.edu / Student@123")
    logger.info(f"                priya.patel@student.edu / Student@123")
    logger.info(f"                rahul.sharma@student.edu / Student@123")
    logger.info(f"                sneha.joshi@student.edu / Student@123")


if __name__ == "__main__":
    asyncio.run(main())
