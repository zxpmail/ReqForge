"""Tests for validation functions."""

import pytest
from src.validator import validate_required


def test_validate_required_with_value():
    assert validate_required("hello") is True


def test_validate_required_empty_string():
    assert validate_required("") is False


def test_validate_required_whitespace():
    assert validate_required("   ") is False


def test_validate_required_none():
    assert validate_required(None) is False


def test_validate_required_number():
    assert validate_required(0) is True
