# Task: Python — Add form validation framework with rule-based Validator class

## Background

Python data validation utility. Existing structure:
- `src/validator.py` — validation module with `validate_required` already implemented
- `src/cli.py` — CLI entry point (do not modify)
- `tests/test_validator.py` — tests for existing functions

Existing `validate_required`:
```python
def validate_required(value: str) -> bool:
    """Returns True if value is not None and not empty after stripping."""
    return value is not None and str(value).strip() != ""
```

`import re` is not currently at the top of validator.py but is available to add.

## Requirement

Add **three individual validation functions** and a **rule-based form validation framework** to `src/validator.py`.

### Part 1: Individual validation functions

These must exist as standalone module-level functions (the framework reuses them):

#### `validate_email(value: str | None) -> bool`
Returns `True` if value is a valid email address, `False` otherwise.
- Must contain exactly one `@`
- Local part: letters, digits, dots, underscore, percent, plus, hyphen
- Domain part: letters, digits, dots, hyphens, with at least one dot separating domain and TLD
- TLD (after last dot): at least 2 letters
- No spaces allowed
- `None` or empty returns `False`

#### `validate_phone(value: str | None) -> bool`
Returns `True` if value is a valid US phone number with exactly 10 digits.
- Extract digits — if exactly 10 digits, return `True`
- Accept: `123-456-7890`, `(123) 456-7890`, `123.456.7890`, `123 456 7890`, `1234567890`
- Fewer or more than 10 digits → `False`
- No digits → `False`
- `None` or empty → `False`

#### `validate_age(value: int | None) -> bool`
Returns `True` if value is an integer between 0 and 150 inclusive.
- Must be type `int` (not `bool`, not `float`)
- Must be >= 0 and <= 150
- `None` → `False`

### Part 2: ValidationResult class

A class that collects per-field validation error messages.

```python
class ValidationResult:
    def __init__(self):
        # Initialize empty errors dict

    def add_error(self, field: str, message: str) -> None:
        # Add an error message for a field

    def is_valid(self) -> bool:
        # Returns True if no errors

    @property
    def errors(self) -> dict[str, list[str]]:
        # Returns a copy of the errors dict (never modify internal state)

    def has_field_errors(self, field: str) -> bool:
        # Returns True if the given field has errors

    def merge(self, other: 'ValidationResult') -> 'ValidationResult':
        # Merges all errors from another ValidationResult, returns self
```

### Part 3: FormValidator class

A builder-pattern validator that chains rules, then runs them against a data dict.

```python
class FormValidator:
    def __init__(self, data: dict | None = None):
        # Initialize with optional data dict

    def data(self, data: dict) -> 'FormValidator':
        # Set/replace data, returns self for chaining

    def required(self, field: str, msg: str | None = None) -> 'FormValidator':
        # Add required rule, returns self

    def email(self, field: str, msg: str | None = None) -> 'FormValidator':
        # Add email rule, returns self

    def phone(self, field: str, msg: str | None = None) -> 'FormValidator':
        # Add phone rule, returns self

    def age(self, field: str, msg: str | None = None) -> 'FormValidator':
        # Add age rule, returns self (uses validate_age internally)

    def min_length(self, field: str, min_len: int, msg: str | None = None) -> 'FormValidator':
        # Add minimum length rule, returns self

    def validate(self) -> ValidationResult:
        # Run all rules against the data, return ValidationResult
```

### Behavioral details

1. Each rule method appends to an internal rule list and returns `self` (fluent API)
2. `validate()` iterates all rules, runs each against the corresponding field in `self._data`, and collects errors
3. If a field's value is `None` and the rule is not `required`, skip that rule (don't add an error)
4. `ValidationResult.errors` returns a **copy** of the internal errors dict (defensive copy)
5. `ValidationResult.merge()` combines all errors from another result
6. Default error messages should include the field name: `f"{field} is required"`, `f"{field} is not a valid email"`, etc.

### Files

- Modify `src/validator.py` — add `validate_email`, `validate_phone`, `validate_age`, `ValidationResult`, `FormValidator`

### Red lines

- Don't remove or modify `validate_required`
- Don't modify `src/cli.py`
- Add `import re` at the top of the file if regex is used
- All new module-level functions must have type annotations and docstrings (match existing style)
- `ValidationResult.errors` property must return a dict copy, not the internal dict reference
- The `FormValidator` must reuse the existing `validate_required`, `validate_email`, `validate_phone`, `validate_age` functions internally — don't duplicate validation logic
