#!/usr/bin/env python3
"""Patch privyConnector.tsx to add embedded wallet and funding config."""
import sys

FILE = sys.argv[1]
MARKER = sys.argv[2]

with open(FILE, "r") as f:
    content = f.read()

if MARKER in content:
    print("   privyConnector.tsx already patched")
    sys.exit(0)

if "embeddedWallets" not in content and "loginMethods: loginMethods," in content:
    content = content.replace(
        "loginMethods: loginMethods,",
        f"""loginMethods: loginMethods,
          // {MARKER} - Embedded wallet & funding config
          embeddedWallets: {{
            createOnLogin: 'users-without-wallets',
            showWalletUIs: true,
          }},
          fundingMethodConfig: {{
            moonpay: {{
              useSandbox: false,
            }},
          }},"""
    )

with open(FILE, "w") as f:
    f.write(content)

print("   privyConnector.tsx patched")
