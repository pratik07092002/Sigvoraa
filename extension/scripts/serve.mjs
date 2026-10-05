import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:");
const types = { ".html": "text/html", ".js": "text/javascript", ".map": "application/json" };

http.createServer(async (req, res) => {
  try {
    const path = join(root, decodeURIComponent(req.url.split("?")[0]));
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(5544, () => console.log("serving extension/ on http://localhost:5544"));
