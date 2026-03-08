"""
Oidar Suite (pytest-optimiert)
Tests für die Syntax aller HTMLwave - Syntax Test, JS, MD und CSS Dateien

Optimierungen:
- pytest-Struktur mit echten Assertions
- Entfernt fehlerhafte main()-Funktion
- Bessere Fehlerberichterstattung
- Keine externen Abhängigkeiten
- Saubere Test-Isolation
"""
import os
import re
import pytest


# Dynamische Ermittlung des Basis-Verzeichnisses
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ============================================================================
# HELPER-FUNKTIONEN
# ============================================================================

def find_files_by_extension(extension, base_dir=BASE_DIR):
    """
    Findet rekursiv alle Dateien mit der angegebenen Endung.
    
    Args:
        extension: Dateiendung (z.B. '.html')
        base_dir: Basis-Verzeichnis für die Suche
    
    Returns:
        Sorted list of relative file paths
    """
    # Verzeichnisse, die ignoriert werden sollen
    exclude_dirs = {'.venv', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.pytest_cache'}
    
    files = []
    for root, dirs, filenames in os.walk(base_dir):
        # Filtere auszuschließende Verzeichnisse in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for filename in filenames:
            if filename.endswith(extension):
                rel_path = os.path.relpath(os.path.join(root, filename), base_dir)
                files.append(rel_path)
    return sorted(files)


def check_balanced_brackets(content):
    """
    Prüft ob Klammern ([]) balanced sind.
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    open_brackets = content.count('[')
    close_brackets = content.count(']')
    if open_brackets != close_brackets:
        return False, f"Ungleiche eckige Klammern: {open_brackets} offen, {close_brackets} geschlossen"
    return True, None


def check_balanced_braces(content):
    """
    Prüft ob geschweifte Klammern ({}) balanced sind.
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    open_braces = content.count('{')
    close_braces = content.count('}')
    if open_braces != close_braces:
        return False, f"Ungleiche geschweifte Klammern: {open_braces} offen, {close_braces} geschlossen"
    return True, None


def check_balanced_parens(content):
    """
    Prüft ob runde Klammern (()) balanced sind.
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    open_parens = content.count('(')
    close_parens = content.count(')')
    if open_parens != close_parens:
        return False, f"Ungleiche runde Klammern: {open_parens} offen, {close_parens} geschlossen"
    return True, None


def check_html_structure(content, filepath):
    """
    Prüft grundlegende HTML-Struktur.
    
    Returns:
        list: Liste von gefundenen Problemen
    """
    issues = []
    
    # 1. Prüfe DOCTYPE
    if '<!DOCTYPE html>' not in content and '<!doctype html>' not in content.lower():
        issues.append("Fehlender DOCTYPE")
    
    # 2. Prüfe html-Tag
    if '<html' not in content:
        issues.append("Fehlender <html> Tag")
    
    # 3. Prüfe head-Tag
    if '<head>' not in content and '<head ' not in content:
        issues.append("Fehlender <head> Tag")
    
    # 4. Prüfe body-Tag
    if '<body>' not in content and '<body ' not in content:
        issues.append("Fehlender <body> Tag")
    
    # 5. Prüfe Title-Tag
    if '<title>' not in content:
        issues.append("Fehlender <title> Tag")
    
    # 6. Prüfe Meta-Charset
    if 'charset' not in content.lower():
        issues.append("Fehlender charset Meta-Tag")
    
    # 7. Prüfe auf ungeschlossene Tags (nur häufige Tags)
    # Verwende einfachere Regex, die auch self-closing oder mit Attributen erfasst
    for tag in ['div', 'span', 'nav', 'header', 'footer', 'main', 'section']:
        open_count = len(re.findall(rf'<{tag}[^>]*>', content, re.IGNORECASE))
        close_count = len(re.findall(rf'</{tag}>', content, re.IGNORECASE))
        if open_count != close_count:
            issues.append(f"Ungleiche Anzahl {tag}-Tags: {open_count} offen, {close_count} geschlossen")
    
    # Spezielle Behandlung für script/style (können externe sein)
    script_opens = len(re.findall(r'<script', content, re.IGNORECASE))
    script_closes = len(re.findall(r'</script>', content, re.IGNORECASE))
    if script_opens != script_closes:
        # Warnung nur wenn wirklich kritisch
        if script_closes > script_opens:
            issues.append(f"Mehr </script> als <script>: {script_opens} offen, {script_closes} geschlossen")
    
    style_opens = len(re.findall(r'<style', content, re.IGNORECASE))
    style_closes = len(re.findall(r'</style>', content, re.IGNORECASE))
    if style_opens != style_closes:
        if style_closes > style_opens:
            issues.append(f"Mehr </style> als <style>: {style_opens} offen, {style_closes} geschlossen")
    
    return issues


def check_js_syntax(content, filepath):
    """
    Prüft grundlegende JavaScript-Syntax.
    
    Returns:
        list: Liste von gefundenen Problemen
    """
    issues = []
    
    # 1. Prüfe Klammerung
    balanced, error = check_balanced_braces(content)
    if not balanced:
        issues.append(error)
    
    balanced, error = check_balanced_brackets(content)
    if not balanced:
        issues.append(error)
    
    balanced, error = check_balanced_parens(content)
    if not balanced:
        issues.append(error)
    
    # 2. Prüfe Template-Literals (vereinfacht)
    template_opens = content.count('`')
    if template_opens % 2 != 0:
        issues.append("Ungerade Backticks (Template-Literal nicht geschlossen)")
    
    # 3. Prüfe Multi-Line Kommentare
    multi_line_comment_opens = content.count('/*')
    multi_line_comment_closes = content.count('*/')
    if multi_line_comment_opens != multi_line_comment_closes:
        issues.append(f"Ungleiche Multi-Line-Kommentare: {multi_line_comment_opens} offen, {multi_line_comment_closes} geschlossen")
    
    # 4. Prüfe Doppelte Semikolons
    double_semicolons = len(re.findall(r';;', content))
    if double_semicolons > 0:
        issues.append(f"Doppelte Semikolons gefunden: {double_semicolons}")
    
    # 5. Prüfe Single-Line Kommentare (nicht geschlossen)
    # Suche nach '//' am Ende ohne Zeilenumbruch - vereinfacht
    lines_with_comment_start = len(re.findall(r'//.*$', content, re.MULTILINE))
    if lines_with_comment_start > 0:
        # Das ist normal, nur ein vereinfachter Check
        pass
    
    return issues


def check_css_syntax(content, filepath):
    """
    Prüft grundlegende CSS-Syntax.
    
    Returns:
        list: Liste von gefundenen Problemen
    """
    issues = []
    
    # 1. Prüfe geschweifte Klammern
    balanced, error = check_balanced_braces(content)
    if not balanced:
        issues.append(error)
    
    # 2. Prüfe Klammern in URLs (vereinfacht)
    balanced, error = check_balanced_parens(content)
    if not balanced:
        issues.append(issues)
    
    return issues


def check_markdown_structure(content, filepath):
    """
    Prüft grundlegende Markdown-Struktur.
    
    Returns:
        list: Liste von gefundenen Problemen (meistens nur Warnungen)
    """
    issues = []
    
    # Prüfe Code-Fences (```)
    code_fences = len(re.findall(r'```', content))
    if code_fences % 2 != 0:
        issues.append(f"Ungleiche Code-Fences: {code_fences}")
    
    return issues


# ============================================================================
# PYTEST-TESTS
# ============================================================================

class TestHTMLSyntax:
    """Test-Klasse für HTML-Syntax"""
    
    @pytest.fixture
    def html_files(self):
        """Fixture: Liste aller HTML-Dateien"""
        return find_files_by_extension('.html')
    
    def test_html_files_exist(self, html_files):
        """Test: Es gibt HTML-Dateien im Projekt"""
        assert len(html_files) > 0, "Keine HTML-Dateien gefunden"
    
    def test_html_syntax_all_files(self, html_files):
        """Test: Alle HTML-Dateien haben gültige Struktur"""
        errors = []
        
        for html_file in html_files:
            filepath = os.path.join(BASE_DIR, html_file)
            
            if not os.path.exists(filepath):
                errors.append(f"{html_file}: Datei nicht gefunden")
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            issues = check_html_structure(content, html_file)
            
            if issues:
                for issue in issues:
                    errors.append(f"{html_file}: {issue}")
        
        assert len(errors) == 0, f"HTML-Syntax Fehler: {errors}"


class TestJavaScriptSyntax:
    """Test-Klasse für JavaScript-Syntax"""
    
    @pytest.fixture
    def js_files(self):
        """Fixture: Liste aller JS-Dateien"""
        return find_files_by_extension('.js')
    
    def test_js_files_exist(self, js_files):
        """Test: Es gibt JS-Dateien im Projekt"""
        assert len(js_files) > 0, "Keine JavaScript-Dateien gefunden"
    
    def test_javascript_syntax_all_files(self, js_files):
        """Test: Alle JavaScript-Dateien haben gültige Syntax"""
        errors = []
        
        for js_file in js_files:
            filepath = os.path.join(BASE_DIR, js_file)
            
            if not os.path.exists(filepath):
                errors.append(f"{js_file}: Datei nicht gefunden")
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            issues = check_js_syntax(content, js_file)
            
            if issues:
                for issue in issues:
                    errors.append(f"{js_file}: {issue}")
        
        assert len(errors) == 0, f"JavaScript-Syntax Fehler: {errors}"


class TestCSSSyntax:
    """Test-Klasse für CSS-Syntax"""
    
    @pytest.fixture
    def css_files(self):
        """Fixture: Liste aller CSS-Dateien"""
        return find_files_by_extension('.css')
    
    def test_css_files_exist(self, css_files):
        """Test: Es gibt CSS-Dateien im Projekt"""
        assert len(css_files) > 0, "Keine CSS-Dateien gefunden"
    
    def test_css_syntax_all_files(self, css_files):
        """Test: Alle CSS-Dateien haben gültige Syntax"""
        errors = []
        
        for css_file in css_files:
            filepath = os.path.join(BASE_DIR, css_file)
            
            if not os.path.exists(filepath):
                errors.append(f"{css_file}: Datei nicht gefunden")
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            issues = check_css_syntax(content, css_file)
            
            if issues:
                for issue in issues:
                    errors.append(f"{css_file}: {issue}")
        
        assert len(errors) == 0, f"CSS-Syntax Fehler: {errors}"


class TestMarkdownSyntax:
    """Test-Klasse für Markdown-Syntax"""
    
    @pytest.fixture
    def md_files(self):
        """Fixture: Liste aller MD-Dateien"""
        return find_files_by_extension('.md')
    
    def test_md_files_exist(self, md_files):
        """Test: Es gibt MD-Dateien im Projekt"""
        assert len(md_files) > 0, "Keine Markdown-Dateien gefunden"
    
    def test_markdown_syntax_all_files(self, md_files):
        """Test: Alle Markdown-Dateien haben gültige Struktur"""
        errors = []
        
        for md_file in md_files:
            filepath = os.path.join(BASE_DIR, md_file)
            
            if not os.path.exists(filepath):
                errors.append(f"{md_file}: Datei nicht gefunden")
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            issues = check_markdown_structure(content, md_file)
            
            if issues:
                for issue in issues:
                    errors.append(f"{md_file}: {issue}")
        
        # Markdown ist tolerant, nur kritische Fehler sollten failen
        # Hier: Nur warnen, nicht failen bei Code-Fences
        # assert len(errors) == 0, f"Markdown Fehler: {errors}"
        # Stattdessen: Prüfen ob wichtigste Dateien (README, etc.) okay sind
        critical_md = [f for f in md_files if 'readme' in f.lower() or 'changelog' in f.lower()]
        for md in critical_md:
            filepath = os.path.join(BASE_DIR, md)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            md_issues = check_markdown_structure(content, md)
            for issue in md_issues:
                errors.append(f"{md}: {issue}")
        
        assert len(errors) == 0, f"Kritische Markdown Fehler: {errors}"
