#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
APEX PRO RACING // High-Performance Desktop Application Runtime & Local Asset Server
- Multi-threaded HTTP/1.1 asset server with HTTP Range streaming for large .glb/.gltf models
- Standalone Windows Desktop App Window (Chrome/Edge --app) with discrete GPU (dGPU) acceleration flags
- Persistent local profile (.apex_app_profile) so localStorage PB records & settings persist across runs
"""

import http.server
import mimetypes
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

mimetypes.add_type("model/gltf-binary", ".glb")
mimetypes.add_type("model/gltf+json", ".gltf")
mimetypes.add_type("application/javascript; charset=utf-8", ".js")
mimetypes.add_type("text/html; charset=utf-8", ".html")
mimetypes.add_type("text/css; charset=utf-8", ".css")


class ApexAssetHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        if "--check" in sys.argv:
            return
        sys.stdout.write("[APEX SERVER] " + (fmt % args) + "\n")

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Accept-Ranges", "bytes")
        if self.path.endswith((".html", ".js", ".css")) or "?" in self.path:
            self.send_header("Cache-Control", "no-cache")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        ctype = self.guess_type(path)
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        try:
            fs = os.fstat(f.fileno())
            size = fs.st_size
            range_header = self.headers.get("Range")
            if range_header:
                m = re.match(r"bytes=(\d+)-(\d*)", range_header)
                if m:
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else size - 1
                    end = min(end, size - 1)
                    if start <= end < size:
                        length = end - start + 1
                        self.send_response(206)
                        self.send_header("Content-type", ctype)
                        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                        self.send_header("Content-Length", str(length))
                        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                        self.end_headers()
                        f.seek(start)
                        self._range_remaining = length
                        return f
            self._range_remaining = None
            self.send_response(200)
            self.send_header("Content-type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_range_remaining", None)
        if remaining is None:
            shutil.copyfileobj(source, outputfile, length=262144)
            return
        buf_size = 262144
        while remaining > 0:
            chunk = source.read(min(buf_size, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


def find_free_port(preferred=8765):
    for p in (preferred, 8766, 8767, 0):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return s.getsockname()[1]
            except OSError:
                continue
    return 0


def find_browser_executable():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return shutil.which("chrome") or shutil.which("msedge")


def run_self_check(port):
    base_url = f"http://127.0.0.1:{port}"
    endpoints = [
        ("GET", "/index.html"),
        ("HEAD", "/assets/models/cars/mclaren_senna.glb"),
        ("HEAD", "/assets/models/cars/amg%201.glb"),
        ("HEAD", "/assets/models/cars/f1_2026_sf26.glb"),
        ("HEAD", "/assets/models/cars/ferrari_296_gt3.glb"),
        ("HEAD", "/assets/models/cars/nissan_x-trail.glb"),
        ("HEAD", "/assets/models/tracks/suzuka_circuit.glb"),
        ("HEAD", "/assets/models/tracks/spa_francorchamps.glb"),
        ("HEAD", "/assets/models/tracks/monza.glb"),
        ("HEAD", "/assets/models/tracks/silverstone.glb"),
        ("HEAD", "/assets/models/tracks/interlagos.glb"),
        ("HEAD", "/assets/models/tracks/red_bull_ring.glb"),
        ("HEAD", "/assets/models/tracks/cota_austin.glb"),
    ]
    for method, path in endpoints:
        req = urllib.request.Request(base_url + path, method=method)
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.status
            clen = int(resp.headers.get("Content-Length", "0"))
            ctype = resp.headers.get("Content-Type", "")
            assert status == 200 and clen > 1000, f"Failed {path}: status={status}, len={clen}"
            print(f"  [OK] {method:4s} {path:44s} -> {status} ({clen:,} bytes, {ctype})")
    print("APEX DESKTOP SERVER SELF-CHECK PASSED 100%!")


def main():
    port = find_free_port()
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), ApexAssetHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    if "--check" in sys.argv:
        try:
            run_self_check(port)
        finally:
            server.shutdown()
        return

    url = f"http://127.0.0.1:{port}/index.html"
    browser = find_browser_executable()
    profile_dir = os.path.join(BASE_DIR, ".apex_app_profile")
    os.makedirs(profile_dir, exist_ok=True)

    print("=" * 68)
    print("  APEX PRO RACING // DESKTOP APPLICATION MODE (dGPU + GLB STREAMING)")
    print(f"  Local Asset Server : {url}")
    print(f"  Browser Engine     : {browser or 'System Default Browser'}")
    print("  Close the game window to stop the server automatically.")
    print("=" * 68)

    if browser:
        args = [
            browser,
            f"--app={url}",
            f"--user-data-dir={profile_dir}",
            "--force_high_performance_gpu",
            "--enable-gpu-rasterization",
            "--enable-zero-copy",
            "--ignore-gpu-blocklist",
            "--autoplay-policy=no-user-gesture-required",
            "--no-first-run",
            "--no-default-browser-check",
            "--start-maximized",
        ]
        try:
            proc = subprocess.Popen(args)
            proc.wait()
        except KeyboardInterrupt:
            pass
        finally:
            server.shutdown()
    else:
        import webbrowser
        webbrowser.open(url)
        try:
            input("Press Enter to stop the server...\n")
        except KeyboardInterrupt:
            pass
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
