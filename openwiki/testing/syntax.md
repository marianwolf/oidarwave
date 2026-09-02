---
type: concept
title: Syntax Testing
description: Validates structural and syntactic correctness of source files including HTML, JavaScript, CSS, Markdown, JSON, and Gitignore through automated pytest checks.
tags: [testing, syntax, validation, html, javascript, css, markdown, json]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-02T20:22:31.727Z
sources:
  - id: openwiki-source-f99a7ec1ea05bc870c213f40
    resource: repo://tests/test_syntax.py
generated: { by: "openwiki/0.5.0", at: "2026-09-02T20:22:31.727Z" }
---
# Syntax Testing

The syntax test suite (`tests/test_syntax.py`) validates the structural and syntactic correctness of source files across multiple languages and formats. It focuses on HTML, JavaScript, Markdown, CSS, JSON, and Gitignore files, ensuring they meet basic structural requirements without requiring external dependencies beyond Python and pytest.

## Responsibilities

- Verify balanced brackets (`[]`, `{}`, `()`) in JavaScript and other files
- Ensure HTML files contain a valid doctype, required tags (`html`, `head`, `body`, `title`), and a charset declaration
- Detect unclosed HTML tags (e.g., `div`, `span`, `nav`, `header`, `footer`, `main`, `section`) and mismatched script/style tags
- Check JavaScript for balanced backticks, balanced block comments (`/* ... */`), and absence of double semicolons (`;;`)
- Validate CSS for balanced braces and parentheses
- Check Markdown for balanced code fences (triple backticks)
- Validate JSON for balanced braces/brackets and parseable syntax
- Check Gitignore for balanced brackets and parentheses

## Entrypoints and Mechanisms

The suite is implemented as a collection of pytest test functions that traverse the project directory (excluding `node_modules`, `.venv`, `__pycache__`, `.git`, `dist`, `build`, `.pytest_cache`).

### Core Helper Functions

- `check_balanced(content, open_c, close_c)`: Generic bracket matching utility used across validators
- `check_html(content)`: Validates HTML-specific structure including doctype, required tags, charset, and tag balance
- `check_js(content)`: Validates JavaScript syntax including brackets, backticks, block comments, and semicolons
- `check_css(content)`: Validates CSS syntax including brace and parenthesis balance
- `check_md(content)`: Validates Markdown structure including code fence balance
- `check_json(content)`: Validates JSON syntax including brace/bracket balance and parseability
- `check_gitignore(content)`: Validates Gitignore syntax including bracket and parenthesis balance

### Test Infrastructure

- `find_files(extension)`: Cached recursive file finder for given extensions
- `all_files_by_extension` fixture: Provides cached file lists for all supported extensions
- `all_contents` fixture: Provides cached file contents for all supported extensions
- `SYNTAX_CONFIGS`: Configuration list mapping file extensions to human-readable names and checker functions

### Test Classes

- `TestFilesExist`: Verifies that files exist for each supported extension
- `TestSyntaxValidation`: Runs syntax validation checks on all files of each type
- `TestCSSResponsiveMobileStyles`: Specific tests for responsive CSS media blocks in `src/css/style.css`

## Important Invariants

- If a file fails any syntax check, the test fails with a descriptive message indicating the nature and location of the issue
- The suite is designed to be fast and runnable in any Python environment without additional setup
- Test parametrization ensures consistent validation across all file types
- Caching mechanisms (`lru_cache`, session-scoped fixtures) improve performance for large codebases

## Related Concepts

- See [Testing Overview](/openwiki/testing/overview.md) for how syntax testing fits into the broader testing strategy
- See [Electron Build Validation](/openwiki/testing/electron-build.md) for build-specific validation tests

## Running the Tests

Execute `pytest tests/test_syntax.py` to run the syntax check suite, or simply `pytest` to run all test suites including website validation and Electron build validation.
