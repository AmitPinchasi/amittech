#!/usr/bin/env python3
"""Pull a Search Analytics summary for amittech.dev from the real Search Console API.

Usage: .venv/bin/python scripts/search_console_report.py [days]
"""
import datetime
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

from google.oauth2 import service_account
from googleapiclient.discovery import build

SITE_URL = "sc-domain:amittech.dev"
CREDENTIALS_PATH = Path(__file__).resolve().parent.parent / ".secrets" / "search-console-service-account.json"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def get_service():
    creds = service_account.Credentials.from_service_account_file(str(CREDENTIALS_PATH), scopes=SCOPES)
    return build("searchconsole", "v1", credentials=creds)


def query(service, start_date, end_date, dimensions, row_limit=25):
    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": dimensions,
        "rowLimit": row_limit,
    }
    result = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
    return result.get("rows", [])


def print_rows(title, rows, dimension_label):
    print(f"\n=== {title} ===")
    if not rows:
        print("(no data)")
        return
    print(f"{dimension_label:<50} {'clicks':>8} {'impr.':>8} {'ctr':>8} {'pos':>6}")
    for row in rows:
        key = " / ".join(row["keys"])
        print(f"{key:<50} {row['clicks']:>8} {row['impressions']:>8} {row['ctr']*100:>7.1f}% {row['position']:>6.1f}")


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 28
    end = datetime.date.today() - datetime.timedelta(days=2)  # GSC data lags ~2 days
    start = end - datetime.timedelta(days=days)

    service = get_service()
    start_s, end_s = start.isoformat(), end.isoformat()
    print(f"amittech.dev Search Console report: {start_s} to {end_s}")

    totals = query(service, start_s, end_s, dimensions=[], row_limit=1)
    if totals:
        t = totals[0]
        print(f"\nTotals: {t['clicks']} clicks, {t['impressions']} impressions, "
              f"{t['ctr']*100:.2f}% CTR, avg position {t['position']:.1f}")
    else:
        print("\nNo totals returned - likely no data indexed/collected yet for this range.")

    print_rows("Top queries", query(service, start_s, end_s, ["query"]), "query")
    print_rows("Top pages", query(service, start_s, end_s, ["page"]), "page")

    sitemaps = service.sitemaps().list(siteUrl=SITE_URL).execute()
    print("\n=== Submitted sitemaps ===")
    for sm in sitemaps.get("sitemap", []):
        print(json.dumps(sm, ensure_ascii=False))


if __name__ == "__main__":
    main()
