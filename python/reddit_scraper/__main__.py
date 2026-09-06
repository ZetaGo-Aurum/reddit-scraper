# ====================================================================
#                 REDDIT SCRAPER CORE & CLI ENGINE
# ====================================================================
#  Author      : ZetaGo-Aurum
#  GitHub      : https://github.com/ZetaGo-Aurum
#  Repository  : https://github.com/ZetaGo-Aurum/reddit-scraper
#  License     : MIT
#
#  [NOTICE & WATERMARK]
#  DO NOT REMOVE THIS WATERMARK OR AUTHOR CREDITS!
#  This software is created and maintained by ZetaGo-Aurum.
#  All rights reserved. Unauthorized removal of this header is prohibited.
# ====================================================================

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from reddit_scraper.cli import main

if __name__ == "__main__":
    main()
