#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
APEX PRO RACING // High-Performance Desktop Application Runtime & Local Asset Server
- Multi-threaded HTTP/1.1 asset server with HTTP Range streaming for large .glb/.gltf models
- Standalone Windows Desktop App Window (Chrome/Edge --app) with discrete GPU (dGPU) acceleration flags
- Persistent local profile (%LOCALAPPDATA%/ApexProRacing/profile) outside OneDrive so PB records & settings persist across runs without syncing browser cache
"""

import http.server
import json
import mimetypes
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import urllib.request

import apex_mp_server

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

RUNTIME_MP_INFO = {
    "wsPort": 8766,
    "httpPort": 8765,
    "lanMode": False,
    "lanIps": ["127.0.0.1"],
}

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

    def do_GET(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path == "/__mp_info.json":
            body = json.dumps(RUNTIME_MP_INFO).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

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


class ApexHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = os.name != "nt"


def start_http_server(bind_host, preferred_ports):
    last_err = None
    for p in preferred_ports:
        try:
            srv = ApexHTTPServer((bind_host, p), ApexAssetHandler)
            return srv, srv.server_address[1]
        except OSError as exc:
            last_err = exc
            continue
    raise last_err if last_err else OSError("Unable to bind HTTP server port")


def find_free_port(preferred=8765, host="127.0.0.1"):
    for p in (preferred, preferred + 1, preferred + 2, 0):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, p))
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


def resolve_profile_dir(migrate=True):
    """Resolve a OneDrive-free browser profile directory and safely migrate saved localStorage data."""
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        profile_dir = os.path.join(local_app_data, "ApexProRacing", "profile")
    else:
        profile_dir = os.path.join(os.path.expanduser("~"), ".apex_pro_racing_profile")
    os.makedirs(profile_dir, exist_ok=True)

    if migrate:
        legacy_dir = os.path.join(BASE_DIR, ".apex_app_profile")
        target_default = os.path.join(profile_dir, "Default")
        target_ls = os.path.join(target_default, "Local Storage")
        if os.path.isdir(legacy_dir) and not os.path.exists(target_ls):
            os.makedirs(target_default, exist_ok=True)
            for rel_src, rel_dst, is_dir in (
                ("Local State", "Local State", False),
                (os.path.join("Default", "Preferences"), os.path.join("Default", "Preferences"), False),
                (os.path.join("Default", "Local Storage"), os.path.join("Default", "Local Storage"), True),
                (os.path.join("Default", "IndexedDB"), os.path.join("Default", "IndexedDB"), True),
            ):
                src_path = os.path.join(legacy_dir, rel_src)
                dst_path = os.path.join(profile_dir, rel_dst)
                try:
                    if is_dir and os.path.isdir(src_path):
                        shutil.copytree(
                            src_path,
                            dst_path,
                            dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("LOCK", "*.tmp"),
                        )
                    elif (not is_dir) and os.path.isfile(src_path):
                        shutil.copy2(src_path, dst_path)
                except (OSError, shutil.Error):
                    pass
    return profile_dir


def run_self_check(port):
    profile_dir = resolve_profile_dir(migrate=True)
    assert os.path.isdir(profile_dir), f"Profile dir missing: {profile_dir}"
    if os.environ.get("LOCALAPPDATA"):
        assert os.path.commonpath([os.path.abspath(BASE_DIR), os.path.abspath(profile_dir)]) != os.path.abspath(BASE_DIR), (
            f"Profile dir is still inside project directory: {profile_dir}"
        )
    print(f"  [OK] PROFILE DIR -> {profile_dir}")
    base_url = f"http://127.0.0.1:{port}"
    endpoints = [
        ("GET", "/index.html"),
        ("GET", "/__mp_info.json"),
        ("HEAD", "/assets/models/cars/mclaren_senna.glb"),
        ("HEAD", "/assets/models/cars/new_mercedes-amg_project_one.glb"),
        ("HEAD", "/assets/models/cars/new_ferrari_laferrari.glb"),
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
            if method == "GET":
                body = resp.read()
                clen = len(body)
            else:
                clen = int(resp.headers.get("Content-Length", "0"))
            ctype = resp.headers.get("Content-Type", "")
            min_len = 10 if path == "/__mp_info.json" else 1000
            assert status == 200 and clen > min_len, f"Failed {path}: status={status}, len={clen}"
            print(f"  [OK] {method:4s} {path:44s} -> {status} ({clen:,} bytes, {ctype})")
    print("APEX DESKTOP SERVER SELF-CHECK PASSED 100%!")


def main():
    is_lan = "--lan" in sys.argv
    is_check = "--check" in sys.argv
    bind_host = "0.0.0.0" if (is_lan and not is_check) else "127.0.0.1"
    http_candidates = (0,) if is_check else (8765, 8767, 8768, 0)
    server, port = start_http_server(bind_host, http_candidates)

    mp_ctrl, mp_port = apex_mp_server.start_mp_server_in_thread(
        host=bind_host,
        preferred_port=0 if is_check else 8766,
    )
    lan_ips = apex_mp_server.get_lan_ips() if is_lan else ["127.0.0.1"]
    RUNTIME_MP_INFO["wsPort"] = mp_port
    RUNTIME_MP_INFO["httpPort"] = port
    RUNTIME_MP_INFO["lanMode"] = is_lan
    RUNTIME_MP_INFO["lanIps"] = lan_ips

    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    if is_check:
        try:
            run_self_check(port)
        finally:
            server.shutdown()
            mp_ctrl.stop()
        return

    url = f"http://127.0.0.1:{port}/index.html"
    browser = find_browser_executable()
    profile_dir = resolve_profile_dir(migrate=True)

    print("=" * 68)
    print(f"  APEX PRO RACING // {'LAN MULTIPLAYER HOST MODE' if is_lan else 'DESKTOP APPLICATION MODE'} (dGPU + GLB + WS)")
    print(f"  Local Asset Server : {url}")
    print(f"  Local WebSocket    : ws://127.0.0.1:{mp_port}")
    if is_lan:
        for ip in lan_ips:
            print(f"  LAN Friend URL     : http://{ip}:{port}/index.html")
            print(f"  LAN WS Endpoint    : ws://{ip}:{mp_port}")
    print(f"  Browser Engine     : {browser or 'System Default Browser'}")
    print(f"  Profile Directory  : {profile_dir}")
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
            mp_ctrl.stop()
    else:
        import webbrowser
        webbrowser.open(url)
        try:
            input("Press Enter to stop the server...\n")
        except KeyboardInterrupt:
            pass
        finally:
            server.shutdown()
            mp_ctrl.stop()


if __name__ == "__main__":
    main()
