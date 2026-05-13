"""
Restore a pg_dump file to a target database.

USE THIS SCRIPT TO TEST YOUR BACKUPS MONTHLY.
A backup you have never restored is not a backup.

Usage:
    python scripts/restore.py --file backups/orbit_2026-05-05_12-00-00.dump
    python scripts/restore.py --file backups/orbit_2026-05-05_12-00-00.dump --target-url postgresql://...

    # Download latest from S3 then restore:
    python scripts/restore.py --s3-latest --target-url postgresql://...

WARNING: This will DROP and recreate the target database. Never point at production.
         Set TARGET_DATABASE_URL or pass --target-url explicitly.
         If neither is set, this script refuses to run.
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()

SAFETY_CHECK_KEYWORDS = ("trolley.proxy.rlwy.net", "railway.internal")


def _pg_env(database_url: str):
    p = urlparse(database_url)
    env = os.environ.copy()
    env["PGPASSWORD"] = p.password or ""
    return env, p


def _refuse_prod(url: str):
    for keyword in SAFETY_CHECK_KEYWORDS:
        if keyword in url:
            print(
                f"ERROR: Target URL looks like production ({keyword} detected).\n"
                "Restore refused. Use a separate test database.",
                file=sys.stderr,
            )
            sys.exit(1)


def download_latest_s3() -> Path:
    try:
        import boto3
    except ImportError:
        print("boto3 not installed. Run: pip install boto3", file=sys.stderr)
        sys.exit(1)

    bucket = os.environ["BACKUP_S3_BUCKET"]
    prefix = os.environ.get("BACKUP_S3_PREFIX", "orbit-backups")

    kwargs = {}
    if endpoint := os.environ.get("AWS_ENDPOINT_URL"):
        kwargs["endpoint_url"] = endpoint

    s3 = boto3.client("s3", **kwargs)
    objects = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    if not objects.get("Contents"):
        print("No backups found in S3 bucket.", file=sys.stderr)
        sys.exit(1)

    latest = max(objects["Contents"], key=lambda o: o["LastModified"])
    key = latest["Key"]
    local_path = Path("backups") / Path(key).name
    local_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Downloading s3://{bucket}/{key} ...")
    s3.download_file(bucket, key, str(local_path))
    print(f"Downloaded to {local_path}")
    return local_path


def restore(dump_file: Path, target_url: str):
    _refuse_prod(target_url)

    if not dump_file.exists():
        print(f"Dump file not found: {dump_file}", file=sys.stderr)
        sys.exit(1)

    env, parsed = _pg_env(target_url)
    dbname = parsed.path.lstrip("/")

    # Drop and recreate target DB to get a clean slate
    base_url = target_url.replace(f"/{dbname}", "/postgres")
    base_env, base_parsed = _pg_env(base_url)

    print(f"Dropping {dbname} on {parsed.hostname} ...")
    drop = subprocess.run(
        ["psql", f"--host={base_parsed.hostname}", f"--port={base_parsed.port or 5432}",
         f"--username={base_parsed.username}", "--dbname=postgres",
         "--command", f"DROP DATABASE IF EXISTS \"{dbname}\";"],
        env=base_env, capture_output=True, text=True,
    )
    if drop.returncode != 0:
        print("DROP DATABASE failed:", drop.stderr, file=sys.stderr)
        sys.exit(1)

    print(f"Creating {dbname} ...")
    create = subprocess.run(
        ["psql", f"--host={base_parsed.hostname}", f"--port={base_parsed.port or 5432}",
         f"--username={base_parsed.username}", "--dbname=postgres",
         "--command", f"CREATE DATABASE \"{dbname}\";"],
        env=base_env, capture_output=True, text=True,
    )
    if create.returncode != 0:
        print("CREATE DATABASE failed:", create.stderr, file=sys.stderr)
        sys.exit(1)

    print(f"Restoring {dump_file} → {dbname} ...")
    restore_cmd = subprocess.run(
        ["pg_restore", "--no-password", "--verbose",
         f"--host={parsed.hostname}", f"--port={parsed.port or 5432}",
         f"--username={parsed.username}", f"--dbname={dbname}",
         str(dump_file)],
        env=env, capture_output=True, text=True,
    )
    if restore_cmd.returncode != 0:
        # pg_restore exits non-zero on warnings too — print but don't hard-fail
        print("pg_restore output:", restore_cmd.stderr)

    print("Restore complete. Run sanity checks:")
    print(f"  psql {target_url} -c 'SELECT COUNT(*) FROM users;'")
    print(f"  psql {target_url} -c 'SELECT COUNT(*) FROM apps;'")
    print(f"  psql {target_url} -c 'SELECT COUNT(*) FROM launch_events;'")


def main():
    parser = argparse.ArgumentParser(description="Orbit DB restore — for backup testing only")
    parser.add_argument("--file", help="Path to .dump file")
    parser.add_argument("--s3-latest", action="store_true", help="Download latest backup from S3 first")
    parser.add_argument("--target-url", help="Target database URL (never use production)")
    args = parser.parse_args()

    target_url = args.target_url or os.environ.get("TARGET_DATABASE_URL")
    if not target_url:
        print(
            "ERROR: No target database URL provided.\n"
            "Set TARGET_DATABASE_URL env var or pass --target-url.\n"
            "Never restore over production.",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.s3_latest:
        dump_file = download_latest_s3()
    elif args.file:
        dump_file = Path(args.file)
    else:
        print("ERROR: provide --file or --s3-latest", file=sys.stderr)
        sys.exit(1)

    restore(dump_file, target_url)


if __name__ == "__main__":
    main()
