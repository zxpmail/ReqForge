package com.example;

public class Validator {

    public static boolean validateRequired(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
