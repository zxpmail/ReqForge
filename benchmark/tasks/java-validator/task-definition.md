# Task: Java — Add annotation-based validation framework

## Background

Java data validation utility. Existing structure:
- `src/main/java/com/example/Validator.java` — validation class with `validateRequired` already implemented
- `src/test/java/com/example/ValidatorTest.java` — tests for existing methods

Existing `validateRequired`:
```java
public static boolean validateRequired(String value) {
    return value != null && !value.trim().isEmpty();
}
```

Project is Maven-based with Java 21 and JUnit 5.

## Requirement

Add **three individual validation methods** and **two custom annotations** with a **reflection-based validated method**.

### Part 1: Individual validation methods

Add these three `public static` methods to `com.example.Validator`:

#### `validateEmail(String value) : boolean`
Returns `true` if value is a valid email address, `false` otherwise.
- Must contain exactly one `@`
- Local part: letters, digits, dots, underscore, percent, plus, hyphen
- Domain part: letters, digits, dots, hyphens, with at least one dot separating domain and TLD
- TLD (after last dot): at least 2 letters
- No spaces allowed
- `null` or empty returns `false`

#### `validatePhone(String value) : boolean`
Returns `true` if value is a valid US phone number with exactly 10 digits.
- Extract all digits — if exactly 10 digits, return `true`
- Accept formats: `123-456-7890`, `(123) 456-7890`, `123.456.7890`, `123 456 7890`, `1234567890`
- Fewer or more than 10 digits returns `false`
- No digits returns `false`
- `null` or empty returns `false`

#### `validateAge(int value) : boolean`
Returns `true` if value is an integer between 0 and 150 inclusive.
- Must be >= 0 and <= 150
- Negative returns `false`
- Over 150 returns `false`

### Part 2: Custom annotations

Create **two annotation definition files** in the `com.example` package:

#### `@Email` annotation (`src/main/java/com/example/Email.java`)

```java
package com.example;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Email {
    String message() default "Invalid email address";
}
```

#### `@Phone` annotation (`src/main/java/com/example/Phone.java`)

```java
package com.example;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Phone {
    String message() default "Invalid phone number";
}
```

Both annotations must have `@Retention(RetentionPolicy.RUNTIME)` (so they can be read via reflection at runtime) and `@Target(ElementType.FIELD)` (for use on class fields).

### Part 3: Reflection-based validation method

Add this method to `com.example.Validator`:

```java
public static Map<String, List<String>> validateAnnotated(Object obj)
```

Behavior:
1. Use `obj.getClass().getDeclaredFields()` to get all fields of the object
2. Call `field.setAccessible(true)` to access private fields
3. For each field:
   a. Check if it has `@Email` annotation via `field.getAnnotation(Email.class)`
   b. If yes, get the field value, convert to String, call `validateEmail(value)` — if invalid, add error message from `annotation.message()`
   c. Check if it has `@Phone` annotation via `field.getAnnotation(Phone.class)`
   d. If yes, get the field value, convert to String, call `validatePhone(value)` — if invalid, add error message from `annotation.message()`
4. Collect errors in `Map<String, List<String>>` where key is field name and value is list of error messages
5. If a field value is `null` and the field is annotated, it should still be validated (null → `validateEmail(null)` returns false → add error)
6. Return the error map (empty map means valid)

### Required imports for Validator.java

Add these imports:
```java
import java.lang.reflect.Field;
import java.util.*;
import java.util.regex.Pattern;  // if using regex
```

### Files

Create/modify **three files**:
1. **NEW** `src/main/java/com/example/Email.java` — @Email annotation
2. **NEW** `src/main/java/com/example/Phone.java` — @Phone annotation
3. **MODIFY** `src/main/java/com/example/Validator.java` — add validateEmail, validatePhone, validateAge, validateAnnotated

### Red lines

- Don't remove or modify `validateRequired`
- Keep the class in `com.example` package
- All three files must have `package com.example;`
- Annotations must have `@Retention(RetentionPolicy.RUNTIME)` — this is critical for reflection to work
- Use exactly `field.setAccessible(true)` for private field access
- The `validateAnnotated` method must handle `IllegalAccessException` gracefully (skip field, don't crash)
- Style must match existing code: `public static` methods, proper indentation
