from http.server import BaseHTTPRequestHandler
from rembg import remove
import cgi
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        ctype, pdict = cgi.parse_header(self.headers.get('Content-Type'))
        pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
        fields = cgi.parse_multipart(self.rfile, pdict)
        image_bytes = fields.get('image')[0]
        output_bytes = remove(image_bytes)
        self.send_response(200)
        self.send_header('Content-Type', 'image/png')
        self.end_headers()
        self.wfile.write(output_bytes)
