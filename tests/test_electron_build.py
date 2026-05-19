"""
Electron build configuration tests for Oidarwave.
"""
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def test_electron_files_exist():
    """Test that Electron main file exists."""
    main_path = BASE_DIR / "electron" / "main.js"
    
    assert main_path.exists(), f"Electron main file not found at {main_path}"


def test_package_json_build_config():
    """Test that package.json has valid Electron builder configuration."""
    package_path = BASE_DIR / "package.json"
    assert package_path.exists(), f"package.json not found at {package_path}"
    
    with open(package_path) as f:
        package_json = json.load(f)
    
    # Check build configuration exists
    assert "build" in package_json, "package.json should have build configuration"
    
    build_config = package_json["build"]
    
    # Check required fields
    assert "appId" in build_config, "build.appId should be defined"
    assert "productName" in build_config, "build.productName should be defined"
    assert "directories" in build_config, "build.directories should be defined"
    assert "files" in build_config, "build.files should be defined"
    
    # Check files array contains required patterns
    files = build_config["files"]
    required_patterns = [
        "electron/**/*",
        "src/**/*",
        "index.html",
        "favicon/**/*",
        "manifest.json",
        "video/**/*",
        "impressum/**/*"
    ]
    
    for pattern in required_patterns:
        assert pattern in files, f"build.files should include {pattern}"


def test_dev_dependencies():
    """Test that electron and electron-builder are in devDependencies."""
    package_path = BASE_DIR / "package.json"
    
    with open(package_path) as f:
        package_json = json.load(f)
    
    dev_deps = package_json.get("devDependencies", {})
    
    assert "electron" in dev_deps, "devDependencies should include electron"
    assert "electron-builder" in dev_deps, "devDependencies should include electron-builder"


if __name__ == "__main__":
    # Run tests directly if executed as script
    test_electron_files_exist()
    print("✓ Electron main file exists")
    
    test_package_json_build_config()
    print("✓ Package.json build configuration is valid")
    
    test_dev_dependencies()
    print("✓ DevDependencies check passed")
    
    print("\nAll tests passed! ✅")