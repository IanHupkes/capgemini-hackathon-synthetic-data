# Front-end portal

Open the portal over HTTP instead of opening the HTML file directly from disk.

## Run locally

From this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/Synthetische%20Data%20Portal.html
```

Opening the page as `file:///.../Synthetische Data Portal.html` will trigger the browser CORS / file-origin error because the bundled JSX script is fetched through Babel.
