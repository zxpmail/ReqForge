package com.example;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ValidatorExtendedTest {

    // --- Test bean for annotation validation ---
    static class Person {
        @Email
        String email;

        @Phone
        String phone;

        Person(String email, String phone) {
            this.email = email;
            this.phone = phone;
        }
    }

    static class PartialPerson {
        @Email
        String email;

        String phone; // no @Phone annotation

        PartialPerson(String email) {
            this.email = email;
        }
    }

    static class NoAnnotations {
        String name;
        int age;
    }

    // --- validateEmail ---

    @Test void email_valid() { assertTrue(Validator.validateEmail("user@example.com")); }
    @Test void email_valid_subdomain() { assertTrue(Validator.validateEmail("user@sub.example.com")); }
    @Test void email_valid_plus() { assertTrue(Validator.validateEmail("user+tag@example.com")); }
    @Test void email_valid_dot_local() { assertTrue(Validator.validateEmail("first.last@example.com")); }
    @Test void email_invalid_no_at() { assertFalse(Validator.validateEmail("userexample.com")); }
    @Test void email_invalid_no_domain() { assertFalse(Validator.validateEmail("user@")); }
    @Test void email_invalid_no_local() { assertFalse(Validator.validateEmail("@example.com")); }
    @Test void email_invalid_spaces() { assertFalse(Validator.validateEmail("user @example.com")); }
    @Test void email_invalid_empty() { assertFalse(Validator.validateEmail("")); }
    @Test void email_invalid_null() { assertFalse(Validator.validateEmail(null)); }

    // --- validatePhone ---

    @Test void phone_valid_dashed() { assertTrue(Validator.validatePhone("123-456-7890")); }
    @Test void phone_valid_parentheses() { assertTrue(Validator.validatePhone("(123) 456-7890")); }
    @Test void phone_valid_dotted() { assertTrue(Validator.validatePhone("123.456.7890")); }
    @Test void phone_valid_digits() { assertTrue(Validator.validatePhone("1234567890")); }
    @Test void phone_valid_spaces() { assertTrue(Validator.validatePhone("123 456 7890")); }
    @Test void phone_invalid_short() { assertFalse(Validator.validatePhone("123-456-789")); }
    @Test void phone_invalid_long() { assertFalse(Validator.validatePhone("123-456-78901")); }
    @Test void phone_invalid_letters() { assertFalse(Validator.validatePhone("abc-def-ghij")); }
    @Test void phone_invalid_empty() { assertFalse(Validator.validatePhone("")); }
    @Test void phone_invalid_null() { assertFalse(Validator.validatePhone(null)); }

    // --- validateAge ---

    @Test void age_valid_25() { assertTrue(Validator.validateAge(25)); }
    @Test void age_valid_0() { assertTrue(Validator.validateAge(0)); }
    @Test void age_valid_150() { assertTrue(Validator.validateAge(150)); }
    @Test void age_invalid_negative() { assertFalse(Validator.validateAge(-1)); }
    @Test void age_invalid_over() { assertFalse(Validator.validateAge(151)); }

    // --- validateAnnotated (@Email + @Phone) ---

    @Test void annotated_validPerson_returnsEmpty() {
        var p = new Person("user@example.com", "123-456-7890");
        assertTrue(Validator.validateAnnotated(p).isEmpty());
    }

    @Test void annotated_invalidEmail_hasError() {
        var p = new Person("not-an-email", "123-456-7890");
        var errors = Validator.validateAnnotated(p);
        assertTrue(errors.containsKey("email"));
        assertFalse(errors.get("email").isEmpty());
    }

    @Test void annotated_invalidPhone_hasError() {
        var p = new Person("user@example.com", "123");
        var errors = Validator.validateAnnotated(p);
        assertTrue(errors.containsKey("phone"));
    }

    @Test void annotated_multipleErrors() {
        var p = new Person("bad", "123");
        var errors = Validator.validateAnnotated(p);
        assertTrue(errors.containsKey("email"));
        assertTrue(errors.containsKey("phone"));
        assertEquals(2, errors.size());
    }

    @Test void annotated_nullValues_stillValidated() {
        var p = new Person(null, null);
        var errors = Validator.validateAnnotated(p);
        // null email → validateEmail(null) → false → should have error
        // null phone → validatePhone(null) → false → should have error
        assertTrue(errors.containsKey("email"));
        assertTrue(errors.containsKey("phone"));
    }

    @Test void annotated_partialFields_onlyValidatesAnnotated() {
        var p = new PartialPerson("bad@");
        var errors = Validator.validateAnnotated(p);
        assertTrue(errors.containsKey("email"));
        assertFalse(errors.containsKey("phone")); // no @Phone on this field
    }

    @Test void annotated_noAnnotations_returnsEmpty() {
        var p = new NoAnnotations();
        assertTrue(Validator.validateAnnotated(p).isEmpty());
    }

    @Test void annotated_usesAnnotationMessage() {
        var p = new Person("bad", "123-456-7890");
        var errors = Validator.validateAnnotated(p);
        assertEquals("Invalid email address", errors.get("email").get(0));
    }
}
