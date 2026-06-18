"""CLI entry point for input validation."""

import json
import sys
from .validator import validate_required


def main():
    """Read JSON from stdin and validate records."""
    data = json.load(sys.stdin)
    if isinstance(data, dict):
        data = [data]
    for record in data:
        valid = validate_required(record.get("name", ""))
        if not valid:
            print(f"Record {record.get('id', '?')}: name is required", file=sys.stderr)
    print(f"Validated {len(data)} record(s)")


if __name__ == "__main__":
    main()
