#!/bin/bash

STAKE_PROGRAM=BSTq9w3kZwNwpBXJEvTZz2G9ZTNyKBvoSeXMvwb4cNZr
SQUAD_PROGRAM=SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf

echo "Starting local devnet"
solana-test-validator --quiet --reset --clone-upgradeable-program $SQUAD_PROGRAM --clone $STAKE_PROGRAM  --url mainnet-beta &
