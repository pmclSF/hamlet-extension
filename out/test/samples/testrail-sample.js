"use strict";
const { testCase, testSuite, step } = require('@testrail/api');
testSuite('Login Feature', () => {
    testCase('Successful Login', () => {
        step('Navigate to login page', () => {
            // Open login page
        });
        step('Enter credentials', () => {
            // Input username and password
        });
        step('Click login', () => {
            // Trigger login
        });
        step('Verify dashboard access', () => {
            // Check dashboard loaded
        });
    });
    testCase('Invalid Credentials', () => {
        step('Navigate to login page', () => {
            // Open login page
        });
        step('Enter incorrect credentials', () => {
            // Input wrong username/password
        });
        step('Attempt login', () => {
            // Trigger login
        });
        step('Verify error message', () => {
            // Check error displayed
        });
    });
});
//# sourceMappingURL=testrail-sample.js.map