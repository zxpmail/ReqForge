package com.example;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ValidatorTest {

    @Test
    void validateRequired_withValue() {
        assertTrue(Validator.validateRequired("hello"));
    }

    @Test
    void validateRequired_emptyString() {
        assertFalse(Validator.validateRequired(""));
    }

    @Test
    void validateRequired_whitespace() {
        assertFalse(Validator.validateRequired("   "));
    }

    @Test
    void validateRequired_null() {
        assertFalse(Validator.validateRequired(null));
    }
}
