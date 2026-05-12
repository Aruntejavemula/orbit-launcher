"""
Manual / scheduled DB backup via pg_dump.

Usage:
    python scripts/backup.py                  # dump to backups/ directory
    python scripts/backup.py --upload         # dump + upload to S3/R2

Env vars (all optional — fall back to DATABASE_URL):
    DATABASE_URL            source database
    BACKUP_DIR              local directory to write dumps (default: ./backups)
    BACKUP_S3_BUCKET        S3/R2 bucket name   (required if --upload)
    BACKUP_S3_PREFIX        key prefix           (default: orbit-backups)
    AWS_ACCESS_KEY_ID       }
    AWS_SECRET_ACCESS_KEY   } standard boto3 env vars
    AWS_ENDPOINT_URL        } set for Cloudflare R2 / non-AWS S3

Output file: <BACKUP_DIR>/orbit_YYYY-MM-DD_HH-MM-SS.dump  (pg_dump custom format)
"""
import argparse
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()


def _pg_env(database_url: str) -> dict:
    """Convert DATABASE_URL into pg_dump env vars so the password never appears in argv."""
    p = urlparse(database_url)
    env = os.environ.copy()
    env["PGPASSWORD"] = p.password or ""
    return env, p


def dump(backup_dir: Path) -> Path:
    database_url = os.environ["DATABASE_URL"]
    env, parsed = _pg_env(database_url)

    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    out_path = backup_dir / f"orbit_{timestamp}.dump"

    cmd = [
        "pg_dump",
        "--format=custom",          # compressed, restoreable with pg_restore
        "--no-password",
        f"--host={parsed.hostname}",
        f"--port={parsed.port or 5432}",
        f"--username={parsed.username}",
        f"--dbname={parsed.path.lstrip('/')}",
        f"--file={out_path}",
    ]

    print(f"Dumping to {out_path} ...")
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print("pg_dump failed:", result.stderr, file=sys.stderr)
        sys.exit(1)

    size_kb = out_path.stat().st_size // 1024
    print(f"Done. {size_kb} KB → {out_path}")
    return out_path


def upload_s3(path: Path):
    try:
        import boto3
    except ImportError:
        print("boto3 not installed. Run: pip install boto3", file=sys.stderr)
        sys.exit(1)

    bucket = os.environ["BACKUP_S3_BUCKET"]
    prefix = os.environ.get("BACKUP_S3_PREFIX", "orbit-backups")
    key = f"{prefix}/{path.name}"

    kwargs = {}
    if endpoint := os.environ.get("AWS_ENDPOINT_URL"):
        kwargs["endpoint_url"] = endpoint

    s3 = boto3.client("s3", **kwargs)
    print(f"Uploading to s3://{bucket}/{key} ...")
    s3.upload_file(str(path), bucket, key)
    print("Upload complete.")


def main():
    parser = argparse.ArgumentParser(description="Orbit DB backup")
    parser.add_argument("--upload", action="store_true", help="Upload dump to S3/R2 after creating it")
    args = parser.parse_args()

    backup_dir = Path(os.environ.get("BACKUP_DIR", "backups"))
    dump_path = dump(backup_dir)

    if args.upload:
        upload_s3(dump_path)


if __name__ == "__main__":
    main()
