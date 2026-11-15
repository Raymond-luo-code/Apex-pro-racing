import subprocess
import json
import re
import os

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_chrome_dom(html_path, timeout=15):
    url = "file:///" + html_path.replace("\\", "/")
    proc = subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--allow-file-access-from-files", "--dump-dom", url],
        capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout
    )
    return proc.stdout

print("=== TEST 1: Proposal Technical Spec in Real Chrome V8 ===")
runner_dom = run_chrome_dom(os.path.join(BASE, "scratch", "proposal_runner.html"))
m_err = re.search(r'<pre id="v8-errors">(.*?)</pre>', runner_dom, re.S)
m_res = re.search(r'<pre id="v8-results">(.*?)</pre>', runner_dom, re.S)
errs = json.loads(m_err.group(1) or "[]") if m_err else ["Missing #v8-errors"]
results = json.loads(m_res.group(1) or "[]") if m_res else []

assert len(errs) == 0, f"V8 Errors: {errs}"
passed = 0
for r in results:
    status = "PASS" if r["pass"] else "FAIL"
    print(f"  [{status}] {r['msg']}")
    if r["pass"]:
        passed += 1
assert passed == len(results) and len(results) >= 15, f"Expected all 15+ tests to pass, got {passed}/{len(results)}"

print("\n=== TEST 2: Full Production index.html Boot in Chrome Headless ===")
index_dom = run_chrome_dom(os.path.join(BASE, "index.html"), timeout=25)
assert len(index_dom) > 10000, f"index.html DOM too short: {len(index_dom)}"
crash_match = re.search(r'<div id="apex-crash-banner"[^>]*>(.*?)</div>', index_dom, re.S)
assert not crash_match, f"Startup crash banner triggered in index.html: {crash_match.group(1)}"
assert 'id="bar-brake"' in index_dom, "Missing #bar-brake in rendered DOM"
print(f"  [PASS] index.html booted cleanly ({len(index_dom)} chars, zero #apex-crash-banner)")
print(f"\nALL PROPOSAL TESTS PASSED: {passed + 1}/{len(results) + 1}")
