"""Data validation functions."""

import re


def validate_required(value: str) -> bool:
    """Returns True if value is not None and not empty after stripping."""
    return value is not None and str(value).strip() != ""
