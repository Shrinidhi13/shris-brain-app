#!/usr/bin/env python3
"""Serve Shri's Stock Brain locally with no third-party packages.

This is a static-file development server, not the stock-analysis API.
"""
from __future__ import annotations

import argparse
import http.server
from functools import partial
from pathlib import Path
from urllib.parse import urlsplit


class ShriRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serve app files and ignore the browser's optional favicon probe."""

    def _is_favicon_request(self) -> bool:
        return urlsplit(self.path).path == "/favicon.ico"

    def end_headers(self) -> None:
        # Development app: always serve the newest local files.
        self.send_header("Cache-Control", "no-store, max-age=0, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _send_empty_favicon(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802 - HTTP handler naming convention
        if self._is_favicon_request():
            self._send_empty_favicon()
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802 - HTTP handler naming convention
        if self._is_favicon_request():
            self._send_empty_favicon()
            return
        super().do_HEAD()


class ReusableThreadingHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Serve Shri's Stock Brain static files on localhost."
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    handler = partial(ShriRequestHandler, directory=str(root))

    with ReusableThreadingHTTPServer((args.host, args.port), handler) as server:
        print(f"Shri's Stock Brain: http://{args.host}:{args.port}")
        print("Static app server only; no Skill or analysis API is running here.")
        print("Build 2026.07.12-brain-r2: neon brain core enabled; cache disabled.")
        print("Press Ctrl+C to stop.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
