"""
Oidar Suite - Syntax-Tests für HTML, JS, MD und CSS Dateien.
Strukturierte und einheitliche Testorganisation mit Fixtures und parametrisierten Tests.
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
            issues.append(f"Ungeschlossener Tag")
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


def check_gitignore(content: str) -> list[str]:
    """Prüft grundlegende .gitignore-Struktur."""
    issues = []
    balanced, error = check_balanced(content, '[', ']')
    if not balanced:
        issues.append(error)
    balanced, error = check_balanced(content, '(', ')')
    if not balanced:
        issues.append(error)
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
    ('.gitignore', 'Gitignore', check_gitignore),
]


@pytest.fixture(scope='session')
def all_files_by_extension() -> dict[str, tuple[str, ...]]:
    """Cached Dateien für alle unterstützten Extensions."""
    return {ext: find_files(ext) for ext, _, _ in SYNTAX_CONFIGS}


@pytest.fixture(scope='session')
def all_contents() -> dict[str, dict[str, str]]:
    """Cached Inhalte für alle Dateien."""
    contents = {}
    for ext, _, _ in SYNTAX_CONFIGS:
        ext_contents = {}
        for path in find_files(ext):
            full = os.path.join(BASE_DIR, path)
            if os.path.exists(full):
                with open(full, 'r', encoding='utf-8') as f:
                    ext_contents[path] = f.read()
        contents[ext] = ext_contents
    return contents


@pytest.mark.unit
@pytest.mark.parametrize('ext,name,checker', SYNTAX_CONFIGS, ids=['HTML', 'JavaScript', 'CSS', 'Markdown', 'JSON', 'Gitignore'])
class TestFilesExist:
    """Test-Klasse: Prüft ob Dateien existieren."""
    
    def test_files_exist(self, ext, name, checker, all_files_by_extension):
        """Test: Es gibt Dateien für den angegebenen Dateityp."""
        files = all_files_by_extension.get(ext, ())
        
        assert files, f"Keine {name}-Dateien gefunden in {BASE_DIR}"
        assert len(files) > 0, f"Erwartet mindestens 1 {name}-Datei"


@pytest.mark.unit
@pytest.mark.parametrize('ext,name,checker', SYNTAX_CONFIGS, ids=['HTML', 'JavaScript', 'CSS', 'Markdown', 'JSON', 'Gitignore'])
class TestSyntaxValidation:
    """Test-Klasse: Prüft Syntax validity aller Dateien."""

    def test_syntax_valid(self, ext, name, checker, all_files_by_extension, all_contents):
        """Test: Alle Dateien haben gültige Syntax."""
        files = all_files_by_extension.get(ext, ())
        contents = all_contents.get(ext, {})

        errors = []
        for path in files:
            content = contents.get(path, "")
            file_errors = checker(content)
            if file_errors:
                errors.extend(f"{path}: {e}" for e in file_errors)

        assert not errors, f"{name} Syntax-Fehler: {errors}"


CSS_MAIN_PATH: Final[str] = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'src', 'css', 'style.css'
)


@pytest.fixture(scope='module')
def main_css_content() -> str:
    """Liest den Inhalt der Haupt-CSS-Datei."""
    with open(CSS_MAIN_PATH, 'r', encoding='utf-8') as f:
        return f.read()


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
class TestCSSResponsiveMobileStyles:
    """Tests für die neu hinzugefügten responsiven Styles in style.css."""

    # --- @media (max-width: 768px) additions ---

    def test_768_container_padding_rule_present(self, main_css_content: str):
        """768px-Block enthält .container mit padding-Regel."""
        block = _extract_media_block(main_css_content, 768)
        assert block, "@media (max-width: 768px) block nicht gefunden"
        assert '.container' in block, ".container fehlt im 768px-Block"
        assert 'padding' in block, "padding fehlt im .container-Block bei 768px"

    def test_768_container_padding_uses_space_variables(self, main_css_content: str):
        """768px .container nutzt CSS-Variablen --space-lg und --space-md für padding."""
        block = _extract_media_block(main_css_content, 768)
        assert 'var(--space-lg)' in block, "--space-lg fehlt im 768px .container padding"
        assert 'var(--space-md)' in block, "--space-md fehlt im 768px .container padding"

    def test_768_container_padding_value(self, main_css_content: str):
        """768px .container hat exakt 'padding: var(--space-lg) var(--space-md)'."""
        block = _extract_media_block(main_css_content, 768)
        assert re.search(
            r'\.container\s*\{[^}]*padding\s*:\s*var\(--space-lg\)\s+var\(--space-md\)',
            block
        ), "Exakter padding-Wert 'var(--space-lg) var(--space-md)' fehlt im 768px .container"

    # --- @media (max-width: 480px) block existence ---

    def test_480_media_block_exists(self, main_css_content: str):
        """@media (max-width: 480px) Block ist vorhanden."""
        block = _extract_media_block(main_css_content, 480)
        assert block, "@media (max-width: 480px) block nicht gefunden"

    def test_480_media_block_has_balanced_braces(self, main_css_content: str):
        """@media (max-width: 480px) Block hat balancierte geschweifte Klammern."""
        block = _extract_media_block(main_css_content, 480)
        balanced, error = check_balanced(block, '{', '}')
        assert balanced, f"Unbalancierte Klammern im 480px-Block: {error}"

    # --- @media (max-width: 480px) .container ---

    def test_480_container_padding(self, main_css_content: str):
        """.container im 480px-Block hat padding mit --space-md und --space-sm."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.container\s*\{[^}]*padding\s*:\s*var\(--space-md\)\s+var\(--space-sm\)',
            block
        ), "padding: var(--space-md) var(--space-sm) fehlt im 480px .container"

    def test_480_container_gap(self, main_css_content: str):
        """.container im 480px-Block hat gap mit --space-lg."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.container\s*\{[^}]*gap\s*:\s*var\(--space-lg\)',
            block
        ), "gap: var(--space-lg) fehlt im 480px .container"

    # --- @media (max-width: 480px) header ---

    def test_480_header_padding(self, main_css_content: str):
        """header im 480px-Block hat padding mit --space-md."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\bheader\s*\{[^}]*padding\s*:\s*var\(--space-md\)\s+0',
            block
        ), "padding: var(--space-md) 0 fehlt im 480px header"

    # --- @media (max-width: 480px) .logo ---

    def test_480_logo_font_size(self, main_css_content: str):
        """.logo im 480px-Block hat font-size: 2rem."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.logo\s*\{[^}]*font-size\s*:\s*2rem',
            block
        ), "font-size: 2rem fehlt im 480px .logo"

    # --- @media (max-width: 480px) nav ---

    def test_480_nav_flex_direction_column(self, main_css_content: str):
        """nav im 480px-Block hat flex-direction: column."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\bnav\s*\{[^}]*flex-direction\s*:\s*column',
            block
        ), "flex-direction: column fehlt im 480px nav"

    def test_480_nav_full_width(self, main_css_content: str):
        """nav im 480px-Block hat width: 100%."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\bnav\s*\{[^}]*width\s*:\s*100%',
            block
        ), "width: 100% fehlt im 480px nav"

    def test_480_nav_border_radius(self, main_css_content: str):
        """nav im 480px-Block hat border-radius mit --radius-md."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\bnav\s*\{[^}]*border-radius\s*:\s*var\(--radius-md\)',
            block
        ), "border-radius: var(--radius-md) fehlt im 480px nav"

    def test_480_nav_gap_zero(self, main_css_content: str):
        """nav im 480px-Block hat gap: 0."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\bnav\s*\{[^}]*gap\s*:\s*0\b',
            block
        ), "gap: 0 fehlt im 480px nav"

    # --- @media (max-width: 480px) nav a ---

    def test_480_nav_a_text_align_center(self, main_css_content: str):
        """nav a im 480px-Block hat text-align: center."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'nav\s+a\s*\{[^}]*text-align\s*:\s*center',
            block
        ), "text-align: center fehlt im 480px nav a"

    def test_480_nav_a_full_width(self, main_css_content: str):
        """nav a im 480px-Block hat width: 100%."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'nav\s+a\s*\{[^}]*width\s*:\s*100%',
            block
        ), "width: 100% fehlt im 480px nav a"

    def test_480_nav_a_border_radius(self, main_css_content: str):
        """nav a im 480px-Block hat border-radius mit --radius-sm."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'nav\s+a\s*\{[^}]*border-radius\s*:\s*var\(--radius-sm\)',
            block
        ), "border-radius: var(--radius-sm) fehlt im 480px nav a"

    def test_480_nav_a_padding(self, main_css_content: str):
        """nav a im 480px-Block hat padding mit --space-md."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'nav\s+a\s*\{[^}]*padding\s*:\s*var\(--space-md\)',
            block
        ), "padding: var(--space-md) fehlt im 480px nav a"

    # --- @media (max-width: 480px) .station-grid ---

    def test_480_station_grid_template_columns(self, main_css_content: str):
        """.station-grid im 480px-Block hat grid-template-columns mit minmax(120px, 1fr)."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.station-grid\s*\{[^}]*grid-template-columns\s*:\s*repeat\(\s*auto-fill\s*,\s*minmax\(\s*120px\s*,\s*1fr\s*\)\s*\)',
            block
        ), "grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) fehlt im 480px .station-grid"

    def test_480_station_grid_gap(self, main_css_content: str):
        """.station-grid im 480px-Block hat gap mit --space-sm."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.station-grid\s*\{[^}]*gap\s*:\s*var\(--space-sm\)',
            block
        ), "gap: var(--space-sm) fehlt im 480px .station-grid"

    # --- @media (max-width: 480px) .station-btn ---

    def test_480_station_btn_padding(self, main_css_content: str):
        """.station-btn im 480px-Block hat padding mit --space-sm."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.station-btn\s*\{[^}]*padding\s*:\s*var\(--space-sm\)',
            block
        ), "padding: var(--space-sm) fehlt im 480px .station-btn"

    def test_480_station_btn_font_size(self, main_css_content: str):
        """.station-btn im 480px-Block hat font-size: 0.9rem."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.station-btn\s*\{[^}]*font-size\s*:\s*0\.9rem',
            block
        ), "font-size: 0.9rem fehlt im 480px .station-btn"

    # --- @media (max-width: 480px) .current-station ---

    def test_480_current_station_font_size(self, main_css_content: str):
        """.current-station im 480px-Block hat font-size: 1.1rem."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.current-station\s*\{[^}]*font-size\s*:\s*1\.1rem',
            block
        ), "font-size: 1.1rem fehlt im 480px .current-station"

    def test_480_current_station_flex_wrap(self, main_css_content: str):
        """.current-station im 480px-Block hat flex-wrap: wrap."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.current-station\s*\{[^}]*flex-wrap\s*:\s*wrap',
            block
        ), "flex-wrap: wrap fehlt im 480px .current-station"

    def test_480_current_station_text_align(self, main_css_content: str):
        """.current-station im 480px-Block hat text-align: center."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.current-station\s*\{[^}]*text-align\s*:\s*center',
            block
        ), "text-align: center fehlt im 480px .current-station"

    # --- @media (max-width: 480px) .station-selector and .player-controls ---

    def test_480_station_selector_and_player_controls_padding(self, main_css_content: str):
        """.station-selector und .player-controls im 480px-Block haben padding mit --space-md."""
        block = _extract_media_block(main_css_content, 480)
        # Both selectors share a rule block; check the combined rule appears
        assert '.station-selector' in block, ".station-selector fehlt im 480px-Block"
        assert '.player-controls' in block, ".player-controls fehlt im 480px-Block"
        assert re.search(
            r'(?:\.station-selector|\.player-controls)[^}]*padding\s*:\s*var\(--space-md\)',
            block, re.DOTALL
        ), "padding: var(--space-md) fehlt für .station-selector/.player-controls im 480px-Block"

    # --- @media (max-width: 480px) .audio-controls ---

    def test_480_audio_controls_gap(self, main_css_content: str):
        """.audio-controls im 480px-Block hat gap mit --space-lg."""
        block = _extract_media_block(main_css_content, 480)
        assert re.search(
            r'\.audio-controls\s*\{[^}]*gap\s*:\s*var\(--space-lg\)',
            block
        ), "gap: var(--space-lg) fehlt im 480px .audio-controls"

    # --- Boundary / regression tests ---

    def test_480_block_does_not_override_reduced_motion(self, main_css_content: str):
        """@media (max-width: 480px) enthält kein prefers-reduced-motion."""
        block = _extract_media_block(main_css_content, 480)
        assert 'prefers-reduced-motion' not in block, \
            "prefers-reduced-motion sollte nicht im 480px-Block stehen"

    def test_480_block_selector_count(self, main_css_content: str):
        """480px-Block enthält mindestens 9 CSS-Selektoren (Vollständigkeitsprüfung)."""
        block = _extract_media_block(main_css_content, 480)
        # Count occurrences of '{' as a proxy for rule blocks
        rule_count = block.count('{')
        assert rule_count >= 9, \
            f"Erwartet mindestens 9 Regelblöcke im 480px-Block, gefunden: {rule_count}"

    def test_768_block_container_rule_not_duplicated(self, main_css_content: str):
        """768px-Block enthält .container nicht mehrfach."""
        block = _extract_media_block(main_css_content, 768)
        occurrences = len(re.findall(r'\.container\s*\{', block))
        assert occurrences == 1, \
            f".container sollte genau einmal im 768px-Block stehen, gefunden: {occurrences}"
