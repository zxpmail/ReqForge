"""Extended tests for validation module — individual functions + framework."""

import pytest
from src.validator import (
    validate_email, validate_phone, validate_age,
    ValidationResult, FormValidator,
)


class TestValidateEmail:
    def test_valid_simple(self):
        assert validate_email("user@example.com") is True

    def test_valid_subdomain(self):
        assert validate_email("user@sub.example.com") is True

    def test_valid_plus(self):
        assert validate_email("user+tag@example.com") is True

    def test_valid_dot_local(self):
        assert validate_email("first.last@example.com") is True

    def test_invalid_no_at(self):
        assert validate_email("userexample.com") is False

    def test_invalid_no_domain(self):
        assert validate_email("user@") is False

    def test_invalid_no_local(self):
        assert validate_email("@example.com") is False

    def test_invalid_spaces(self):
        assert validate_email("user @example.com") is False

    def test_invalid_empty(self):
        assert validate_email("") is False

    def test_invalid_none(self):
        assert validate_email(None) is False


class TestValidatePhone:
    def test_valid_dashed(self):
        assert validate_phone("123-456-7890") is True

    def test_valid_parentheses(self):
        assert validate_phone("(123) 456-7890") is True

    def test_valid_dotted(self):
        assert validate_phone("123.456.7890") is True

    def test_valid_digits_only(self):
        assert validate_phone("1234567890") is True

    def test_valid_spaces(self):
        assert validate_phone("123 456 7890") is True

    def test_invalid_short(self):
        assert validate_phone("123-456-789") is False

    def test_invalid_long(self):
        assert validate_phone("123-456-78901") is False

    def test_invalid_letters(self):
        assert validate_phone("abc-def-ghij") is False

    def test_invalid_empty(self):
        assert validate_phone("") is False

    def test_invalid_none(self):
        assert validate_phone(None) is False


class TestValidateAge:
    def test_valid_25(self):
        assert validate_age(25) is True

    def test_valid_0(self):
        assert validate_age(0) is True

    def test_valid_150(self):
        assert validate_age(150) is True

    def test_invalid_negative(self):
        assert validate_age(-1) is False

    def test_invalid_over_150(self):
        assert validate_age(151) is False

    def test_invalid_string(self):
        assert validate_age("25") is False

    def test_invalid_float(self):
        assert validate_age(25.5) is False

    def test_invalid_bool(self):
        assert validate_age(True) is False

    def test_invalid_none(self):
        assert validate_age(None) is False


class TestValidationResult:
    def test_is_valid_on_new(self):
        result = ValidationResult()
        assert result.is_valid() is True

    def test_add_error_makes_invalid(self):
        result = ValidationResult()
        result.add_error("name", "name is required")
        assert result.is_valid() is False

    def test_errors_dict_after_add(self):
        result = ValidationResult()
        result.add_error("name", "name is required")
        assert "name" in result.errors
        assert result.errors["name"] == ["name is required"]

    def test_errors_returns_copy(self):
        result = ValidationResult()
        result.add_error("name", "name is required")
        errs = result.errors
        errs["extra"] = ["should not affect"]
        assert "extra" not in result.errors

    def test_has_field_errors(self):
        result = ValidationResult()
        result.add_error("email", "invalid email")
        assert result.has_field_errors("email") is True
        assert result.has_field_errors("name") is False

    def test_merge(self):
        r1 = ValidationResult()
        r1.add_error("name", "required")
        r2 = ValidationResult()
        r2.add_error("email", "invalid email")
        r1.merge(r2)
        assert r1.has_field_errors("name") is True
        assert r1.has_field_errors("email") is True
        assert r2.has_field_errors("name") is False  # r2 unchanged

    def test_multiple_errors_same_field(self):
        result = ValidationResult()
        result.add_error("name", "required")
        result.add_error("name", "too short")
        assert len(result.errors["name"]) == 2


class TestFormValidator:
    def test_required_valid(self):
        result = FormValidator({"name": "Alice"}).required("name").validate()
        assert result.is_valid() is True

    def test_required_invalid(self):
        result = FormValidator({"name": ""}).required("name").validate()
        assert result.is_valid() is False
        assert result.has_field_errors("name") is True

    def test_required_missing_key(self):
        result = FormValidator({}).required("name").validate()
        assert result.is_valid() is False

    def test_email_valid(self):
        result = FormValidator({"email": "a@b.com"}).email("email").validate()
        assert result.is_valid() is True

    def test_email_invalid(self):
        result = FormValidator({"email": "invalid"}).email("email").validate()
        assert result.is_valid() is False

    def test_phone_valid(self):
        result = FormValidator({"phone": "123-456-7890"}).phone("phone").validate()
        assert result.is_valid() is True

    def test_phone_invalid(self):
        result = FormValidator({"phone": "123"}).phone("phone").validate()
        assert result.is_valid() is False

    def test_age_valid(self):
        result = FormValidator({"age": 25}).age("age").validate()
        assert result.is_valid() is True

    def test_age_invalid(self):
        result = FormValidator({"age": -1}).age("age").validate()
        assert result.is_valid() is False

    def test_multiple_fields_all_valid(self):
        data = {"name": "Alice", "email": "a@b.com", "age": 30}
        result = FormValidator(data).required("name").email("email").age("age").validate()
        assert result.is_valid() is True

    def test_multiple_fields_some_invalid(self):
        data = {"name": "", "email": "bad", "age": 30}
        result = FormValidator(data).required("name").email("email").age("age").validate()
        assert result.is_valid() is False
        assert result.has_field_errors("name") is True
        assert result.has_field_errors("email") is True
        assert result.has_field_errors("age") is False

    def test_min_length_valid(self):
        result = FormValidator({"pass": "12345"}).min_length("pass", 4).validate()
        assert result.is_valid() is True

    def test_min_length_invalid(self):
        result = FormValidator({"pass": "abc"}).min_length("pass", 5).validate()
        assert result.is_valid() is False

    def test_data_setter(self):
        v = FormValidator().data({"name": "Alice"}).required("name")
        assert v.validate().is_valid() is True

    def test_custom_error_message(self):
        result = FormValidator({"email": "bad"}).email("email", msg="Custom error").validate()
        assert "Custom error" in result.errors["email"]

    def test_none_value_skips_non_required_rules(self):
        """None value should not fail email/phone/age rules (only required fails)."""
        data = {"email": None, "phone": None}
        result = FormValidator(data).email("email").phone("phone").validate()
        assert result.is_valid() is True
