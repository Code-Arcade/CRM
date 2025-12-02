import http.server
import socketserver
import webbrowser
import os

PORT = 8000

# Change to the directory containing the HTML files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

print("=" * 60)
print("IIPL CRM Dashboard Server")
print("=" * 60)
print(f"\n✓ Server starting on port {PORT}...")
print(f"✓ Dashboard URL: http://localhost:{PORT}")
print(f"\n📂 Serving files from: {os.getcwd()}")
print("\n🚀 Opening dashboard in your default browser...")
print("\nPress Ctrl+C to stop the server")
print("=" * 60)

# Open browser after a short delay
import threading
def open_browser():
    import time
    time.sleep(1.5)
    webbrowser.open(f'http://localhost:{PORT}')

browser_thread = threading.Thread(target=open_browser)
browser_thread.daemon = True
browser_thread.start()

# Start server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")
        print("=" * 60)
