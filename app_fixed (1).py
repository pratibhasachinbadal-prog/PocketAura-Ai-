import os

from pocketaura_app import OPENROUTER_API_KEY, app

if __name__ == "__main__":
    print("""
============================================================
                 POCKETAURA AI
============================================================

Open:

http://127.0.0.1:5000

Network:

http://YOUR-PC-IP:5000

AI mode:
""")
    print(
        "REAL AI"
        if OPENROUTER_API_KEY
        else "DEMO MODE - no API key configured"
    )
    print("""
============================================================
""")
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False,
    )
