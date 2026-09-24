"""
Oidar Suite - Syntax-Tests für HTML, JS, MD und CSS Dateien.
"""

import json
import os
import re
from collections.abc import Callable
from functools import lru_cache
from typing import Final

import pytest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXCLUDE_DIRS: Final[frozenset[str]] = frozenset({
    '.venv', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.pytest_cache'
})

_RE_TAGS: Final[list[tuple[str, re.Pattern, re.Pattern]]] = [
    (tag, re.compile(rf'<{tag}[^>]*>', re.IGNORECASE), re.compile(rf'</{tag}>', re.IGNORECASE))
    for tag in ('div', 'span', 'nav', 'header', 'footer', 'main', 'section')
]
_RE_SCRIPT: Final[tuple[re.Pattern, re.Pattern]] = (
    re.compile(r'<script', re.IGNORECASE), re.compile(r'</script>', re.IGNORECASE))
_RE_STYLE: Final[tuple[re.Pattern, re.Pattern]] = (
    re.compile(r'<style', re.IGNORECASE), re.compile(r'</style>', re.IGNORECASE))
_RE_CODE_FENCE: Final[re.Pattern] = re.compile(r'```')
_RE_DOCTYPE: Final[re.Pattern] = re.compile(r'<!doctype', re.IGNORECASE)


def check_balanced(content: str, open_c: str, close_c: str) -> tuple[bool, str | None]:
    """Prüft ob Klammern balanced sind."""
    stack = []
    for i, char in enumerate(content):
        if char == open_c:
            stack.append(char)
        elif char == close_c:
            if not stack:
                return False, f"Unmatched '{close_c}' at position {i}"
            stack.pop()
    if stack:
        return False, f"Unmatched '{open_c}' at {content.rfind(open_c)}"
    return True, None


def check_html(content: str) -> list[str]:
    """Prüft grundlegende HTML-Struktur."""
    issues = []
    cl = content.lower()

    if not _RE_DOCTYPE.search(cl):
        issues.append("Fehlender <doctype>")

    required = ('html', 'head', 'body', 'title')
    for tag in required:
        if f'<{tag}' not in cl:
            issues.append(f"Fehlender <{tag}>")

    if 'charset' not in cl:
        issues.append("Fehlender charset")

    for _, open_re, close_re in _RE_TAGS:
        if open_re.search(content) and not close_re.search(content):
            issues.append("Ungeschlossener Tag")
            break

    s_open, s_close = _RE_SCRIPT
    if s_close.search(content) and not s_open.search(content):
        issues.append("Mehr </script> als <script>")

    st_open, st_close = _RE_STYLE
    if st_close.search(content) and not st_open.search(content):
        issues.append("Mehr </style> als <style>")

    return issues


def check_js(content: str) -> list[str]:
    """Prüft grundlegende JavaScript-Syntax."""
    issues = []

    for open_c, close_c in [('[', ']'), ('{', '}'), ('(', ')')]:
        balanced, error = check_balanced(content, open_c, close_c)
        if not balanced:
            issues.append(error)

    if content.count('`') % 2:
        issues.append("Ungerade Backticks")

    opens, closes = content.count('/*'), content.count('*/')
    if opens != closes:
        issues.append(f"Ungleiche Kommentare: {opens} vs {closes}")

    if ';;' in content:
        issues.append("Doppelte Semikolons")

    return issues


def check_css(content: str) -> list[str]:
    """Prüft grundlegende CSS-Syntax."""
    issues = []
    balanced, error = check_balanced(content, '{', '}')
    if not balanced:
        issues.append(error)
    balanced, error = check_balanced(content, '(', ')')
    if not balanced:
        issues.append(error)
    return issues


def check_md(content: str) -> list[str]:
    """Prüft grundlegende Markdown-Struktur."""
    if len(_RE_CODE_FENCE.findall(content)) % 2:
        return ["Ungleiche Code-Fences"]
    return []


def check_json(content: str) -> list[str]:
    """Prüft grundlegende JSON-Syntax."""
    issues = []
    balanced, error = check_balanced(content, '{', '}')
    if not balanced:
        issues.append(error)
    balanced, error = check_balanced(content, '[', ']')
    if not balanced:
        issues.append(error)
    try:
        json.loads(content)
    except json.JSONDecodeError as e:
        issues.append(f"JSON-Fehler: {e}")
    return issues


@lru_cache(maxsize=None)
def find_files(extension: str) -> tuple[str, ...]:
    """Findet rekursiv alle Dateien mit der angegebenen Endung (gecached)."""
    files = []
    for root, dirs, filenames in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for filename in filenames:
            if filename.endswith(extension):
                files.append(os.path.relpath(os.path.join(root, filename), BASE_DIR))
    return tuple(sorted(files))


FileTypeConfig = tuple[str, str, Callable[[str], list[str]]]

SYNTAX_CONFIGS: Final[list[FileTypeConfig]] = [
    ('.html', 'HTML', check_html),
    ('.js', 'JavaScript', check_js),
    ('.css', 'CSS', check_css),
    ('.md', 'Markdown', check_md),
    ('.json', 'JSON', check_json),
]


@pytest.fixture(scope='session')
def all_contents() -> dict[str, dict[str, str]]:
    """Cached Inhalte aller geprüften Dateien (einmalig eingelesen)."""
    contents = {}
    for ext, _, _ in SYNTAX_CONFIGS:
        ext_contents = {}
        for path in find_files(ext):
            full = os.path.join(BASE_DIR, path)
            with open(full, encoding='utf-8') as f:
                ext_contents[path] = f.read()
        contents[ext] = ext_contents
    return contents


@pytest.mark.unit
@pytest.mark.parametrize('ext,name,checker', SYNTAX_CONFIGS,
                         ids=['HTML', 'JavaScript', 'CSS', 'Markdown', 'JSON'])
def test_syntax_valid(ext, name, checker, all_contents):
    """Alle Dateien eines Typs haben gültige Syntax."""
    paths = find_files(ext)
    assert paths, f"Keine {name}-Dateien gefunden in {BASE_DIR}"

    errors = []
    for path in paths:
        file_errors = checker(all_contents[ext][path])
        if file_errors:
            errors.extend(f"{path}: {e}" for e in file_errors)

    assert not errors, f"{name} Syntax-Fehler: {errors}"


def _extract_media_block(css: str, max_width: int) -> str:
    """Extrahiert den Block einer @media (max-width: Npx) Regel."""
    pattern = rf'@media\s*\(\s*max-width\s*:\s*{max_width}px\s*\)\s*\{{'
    match = re.search(pattern, css)
    if not match:
        return ''
    start = match.end()
    depth = 1
    i = start
    while i < len(css) and depth > 0:
        if css[i] == '{':
            depth += 1
        elif css[i] == '}':
            depth -= 1
        i += 1
    return css[start:i - 1]


@pytest.mark.unit
class TestCSSResponsive:
    """Strukturtests für die responsiven Breakpoints (keine exakten Wert-Assertions)."""

    def test_768_block_has_container(self, main_css_content: str):
        block = _extract_media_block(main_css_content, 768)
        assert block, "@media (max-width: 768px) block nicht gefunden"
        assert '.container' in block, ".container fehlt im 768px-Block"
        assert len(re.findall(r'\.container\s*\{', block)) == 1, \
            ".container sollte genau einmal im 768px-Block stehen"

    def test_480_block_structure(self, main_css_content: str):
        block = _extract_media_block(main_css_content, 480)
        assert block, "@media (max-width: 480px) block nicht gefunden"
        balanced, error = check_balanced(block, '{', '}')
        assert balanced, f"Unbalancierte Klammern im 480px-Block: {error}"
        assert block.count('{') >= 9, \
            f"Erwartet mindestens 9 Regelblöcke im 480px-Block, gefunden: {block.count('{')}"

    def test_480_block_core_selectors(self, main_css_content: str):
        block = _extract_media_block(main_css_content, 480)
        for selector in ('.container', 'header', '.logo', 'nav', '.station-grid',
                         '.station-btn', '.current-station', '.audio-controls'):
            assert selector in block, f"{selector} fehlt im 480px-Block"

    def test_480_block_does_not_override_reduced_motion(self, main_css_content: str):
        block = _extract_media_block(main_css_content, 480)
        assert 'prefers-reduced-motion' not in block, \
            "prefers-reduced-motion sollte nicht im 480px-Block stehen"
