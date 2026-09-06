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

import unittest
import sys
from .test_scraper import TestRedditModels, TestRedditScraperLogic


def run_tests():
    print("\n" + "=" * 60)
    print("        RUNNING REDDIT SCRAPER TEST SUITE")
    print("=" * 60)
    suite = unittest.TestSuite()
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(TestRedditModels))
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(TestRedditScraperLogic))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
