"""
Oidarwave - Syntax Test Suite
Tests für die Syntax aller HTML, JS, MD und CSS Dateien
"""
import os
import re

BASE_DIR = "/home/marian/nextcloud/github/oidarwave"

def find_files_by_extension(extension, base_dir=BASE_DIR):
    """Findet rekursiv alle Dateien mit der angegebenen Endung"""
    # Verzeichnisse, die ignoriert werden sollen
    exclude_dirs = {'.venv', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.pytest_cache'}
    
    files = []
    for root, dirs, filenames in os.walk(base_dir):
        # Filtere auszuschließende Verzeichnisse
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for filename in filenames:
            if filename.endswith(extension):
                rel_path = os.path.relpath(os.path.join(root, filename), base_dir)
                files.append(rel_path)
    return sorted(files)

def test_html_syntax():
    """Test der HTML-Syntax"""
    print("\n" + "="*60)
    print("TEST: HTML-Syntax")
    print("="*60)
    
    html_files = find_files_by_extension('.html')
    
    errors = []
    
    for html_file in html_files:
        filepath = os.path.join(BASE_DIR, html_file)
        print(f"\nPrüfe: {html_file}")
        
        if not os.path.exists(filepath):
            print(f"  ⚠ Datei nicht gefunden")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
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
        
        # 7. Prüfe auf ungeschlossene Tags
        open_divs = len(re.findall(r'<div[^/>]*>', content))
        close_divs = len(re.findall(r'</div>', content))
        if open_divs != close_divs:
            issues.append(f"Ungleiche Anzahl div-Tags: {open_divs} offen, {close_divs} geschlossen")
        
        open_spans = len(re.findall(r'<span[^/>]*>', content))
        close_spans = len(re.findall(r'</span>', content))
        if open_spans != close_spans:
            issues.append(f"Ungleiche Anzahl span-Tags: {open_spans} offen, {close_spans} geschlossen")
        
        # 8. Prüfe Script-Tags
        script_opens = len(re.findall(r'<script', content))
        script_closes = len(re.findall(r'</script>', content))
        if script_opens != script_closes:
            issues.append(f"Ungleiche Anzahl script-Tags: {script_opens} offen, {script_closes} geschlossen")
        
        # 9. Prüfe Style-Tags
        style_opens = len(re.findall(r'<style', content))
        style_closes = len(re.findall(r'</style>', content))
        if style_opens != style_closes:
            issues.append(f"Ungleiche Anzahl style-Tags: {style_opens} offen, {style_closes} geschlossen")
        
        if issues:
            for issue in issues:
                print(f"  ✗ {issue}")
                errors.append(f"{html_file}: {issue}")
        else:
            print(f"  ✓ Keine Syntaxfehler gefunden")
    
    print(f"\nHTML-Syntax Test: {'✓ BESTANDEN' if not errors else '✗ FEHLGESCHLAGEN'}")
    assert len(errors) == 0, f"HTML-Syntax Fehler gefunden: {errors}"


def test_javascript_syntax():
    """Test der JavaScript-Syntax"""
    print("\n" + "="*60)
    print("TEST: JavaScript-Syntax")
    print("="*60)
    
    js_files = find_files_by_extension('.js')
    
    errors = []
    
    for js_file in js_files:
        filepath = os.path.join(BASE_DIR, js_file)
        print(f"\nPrüfe: {js_file}")
        
        if not os.path.exists(filepath):
            print(f"  ⚠ Datei nicht gefunden")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        issues = []
        
        # 1. Prüfe Klammerung
        open_braces = content.count('{')
        close_braces = content.count('}')
        if open_braces != close_braces:
            issues.append(f"Ungleiche geschweifte Klammern: {open_braces} offen, {close_braces} geschlossen")
        
        open_brackets = content.count('[')
        close_brackets = content.count(']')
        if open_brackets != close_brackets:
            issues.append(f"Ungleiche eckige Klammern: {open_brackets} offen, {close_brackets} geschlossen")
        
        open_parens = content.count('(')
        close_parens = content.count(')')
        if open_parens != close_parens:
            issues.append(f"Ungleiche runde Klammern: {open_parens} offen, {close_parens} geschlossen")
        
        # 2. Prüfe Template-Literals
        template_opens = content.count('`')
        if template_opens % 2 != 0:
            issues.append("Ungerade Backticks (Template-Literal nicht geschlossen)")
        
        # 3. Prüfe Strings
        single_quote_strings = content.count("'")
        if single_quote_strings % 2 != 0:
            issues.append("Ungerade einfache Anführungszeichen")
        
        double_quote_strings = content.count('"')
        if double_quote_strings % 2 != 0:
            issues.append("Ungerade doppelte Anführungszeichen")
        
        # 4. Prüfe Kommentare
        multi_line_comment_opens = content.count('/*')
        multi_line_comment_closes = content.count('*/')
        if multi_line_comment_opens != multi_line_comment_closes:
            issues.append(f"Ungleiche Multi-Line-Kommentare: {multi_line_comment_opens} offen, {multi_line_comment_closes} geschlossen")
        
        # 5. Prüfe Doppelte Semikolons
        double_semicolons = len(re.findall(r';;', content))
        if double_semicolons > 0:
            issues.append(f"Doppelte Semikolons: {double_semicolons}")
        
        if issues:
            for issue in issues:
                print(f"  ✗ {issue}")
                errors.append(f"{js_file}: {issue}")
        else:
            print(f"  ✓ Keine Syntaxfehler gefunden")
    
    print(f"\nJavaScript-Syntax Test: {'✓ BESTANDEN' if not errors else '✗ FEHLGESCHLAGEN'}")
    assert len(errors) == 0, f"JavaScript-Syntax Fehler gefunden: {errors}"


def test_css_syntax():
    """Test der CSS-Syntax"""
    print("\n" + "="*60)
    print("TEST: CSS-Syntax")
    print("="*60)
    
    css_files = find_files_by_extension('.css')
    
    errors = []
    
    for css_file in css_files:
        filepath = os.path.join(BASE_DIR, css_file)
        print(f"\nPrüfe: {css_file}")
        
        if not os.path.exists(filepath):
            print(f"  ⚠ Datei nicht gefunden")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        issues = []
        
        # 1. Prüfe geschweifte Klammern
        open_braces = content.count('{')
        close_braces = content.count('}')
        if open_braces != close_braces:
            issues.append(f"Ungleiche geschweifte Klammern: {open_braces} offen, {close_braces} geschlossen")
        
        # 2. Prüfe Klammern in URLs
        url_parens_open = content.count('(')
        url_parens_close = content.count(')')
        if url_parens_open != url_parens_close:
            issues.append(f"Ungleiche Klammern in URLs: {url_parens_open} offen, {url_parens_close} geschlossen")
        
        # 3. Prüfe @media Queries
        media_queries = re.findall(r'@media[^{]+{', content)
        print(f"    → {len(media_queries)} @media Queries")
        
        # 4. Prüfe Farbwerte
        hex_colors = len(re.findall(r'#[0-9a-fA-F]{3,8}', content))
        print(f"    → {hex_colors} Hex-Farbwerte")
        
        # 5. Prüfe Strings
        quote_double = content.count('"')
        quote_single = content.count("'")
        if quote_double % 2 != 0:
            issues.append("Ungerade doppelte Anführungszeichen")
        if quote_single % 2 != 0:
            issues.append("Ungerade einfache Anführungszeichen")
        
        if issues:
            for issue in issues:
                print(f"  ✗ {issue}")
                errors.append(f"{css_file}: {issue}")
        else:
            print(f"  ✓ Keine Syntaxfehler gefunden")
    
    print(f"\nCSS-Syntax Test: {'✓ BESTANDEN' if not errors else '✗ FEHLGESCHLAGEN'}")
    assert len(errors) == 0, f"CSS-Syntax Fehler gefunden: {errors}"


def test_markdown_syntax():
    """Test der Markdown-Syntax"""
    print("\n" + "="*60)
    print("TEST: Markdown-Syntax")
    print("="*60)
    
    md_files = find_files_by_extension('.md')
    
    errors = []
    
    for md_file in md_files:
        filepath = os.path.join(BASE_DIR, md_file)
        print(f"\nPrüfe: {md_file}")
        
        if not os.path.exists(filepath):
            print(f"  ⚠ Datei nicht gefunden")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        issues = []
        
        # 1. Prüfe Überschriften
        h1_count = len(re.findall(r'^# .+$', content, re.MULTILINE))
        h2_count = len(re.findall(r'^## .+$', content, re.MULTILINE))
        h3_count = len(re.findall(r'^### .+$', content, re.MULTILINE))
        print(f"    → {h1_count} H1, {h2_count} H2, {h3_count} H3 Überschriften")
        
        # 2. Prüfe Code-Blöcke mit Backticks
        backticks = content.count('`')
        if backticks >= 3:
            code_fence_opens = len(re.findall(r'```', content))
            if code_fence_opens % 2 != 0:
                issues.append(f"Ungleiche Code-Fences: {code_fence_opens}")
        
        # 3. Prüfe Listen
        ul_items = len(re.findall(r'^[\-\*] .+$', content, re.MULTILINE))
        ol_items = len(re.findall(r'^\d+\. .+$', content, re.MULTILINE))
        print(f"    → {ul_items} unordered, {ol_items} ordered Listenpunkte")
        
        # 4. Prüfe Links
        links = re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)
        print(f"    → {len(links)} Links")
        
        # 5. Prüfe Bilder
        images = re.findall(r'!\[([^\]]*)\]\(([^\)]+)\)', content)
        print(f"    → {len(images)} Bilder")
        
        # 6. Prüfe Tabellen
        tables = len(re.findall(r'\|.+\|.+\|', content))
        if tables > 0:
            print(f"    → {tables} Tabellenzeilen")
        
        # 7. Prüfe Blockquotes
        blockquotes = len(re.findall(r'^> .+$', content, re.MULTILINE))
        print(f"    → {blockquotes} Blockquotes")
        
        # 8. Prüfe Fett/Kursiv
        bold_count = len(re.findall(r'\*\*[^*]+\*\*', content))
        italic_count = len(re.findall(r'\*[^*]+\*', content))
        print(f"    → {bold_count} Fett, {italic_count} Kursiv")
        
        if issues:
            for issue in issues:
                print(f"  ✗ {issue}")
                errors.append(f"{md_file}: {issue}")
        else:
            print(f"  ✓ Keine Syntaxfehler gefunden")
    
    print(f"\nMarkdown-Syntax Test: {'✓ BESTANDEN' if not errors else '✗ FEHLGESCHLAGEN'}")
    assert len(errors) == 0, f"Markdown-Syntax Fehler gefunden: {errors}"


def main():
    """Hauptfunktion - führt alle Syntax-Tests aus"""
    print("\n" + "="*60)
    print("OIDARWAVE - SYNTAX TEST SUITE")
    print("="*60)
    print(f"Arbeitsverzeichnis: {BASE_DIR}")
    
    results = {
        "HTML": test_html_syntax(),
        "JavaScript": test_javascript_syntax(),
        "CSS": test_css_syntax(),
        "Markdown": test_markdown_syntax()
    }
    
    print("\n" + "="*60)
    print("ERGEBNIS-ZUSAMMENFASSUNG")
    print("="*60)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✓ BESTANDEN" if passed else "✗ FEHLGESCHLAGEN"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("ALLE SYNTAX-TESTS ERFOLGREICH ABGESCHLOSSEN")
    else:
        print("EINIGE TESTS FEHLGESCHLAGEN - BITTE FEHLER KORRIGIEREN")
    print("="*60)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())
