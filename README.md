# Vovo Project

To test this project, you have to install solana tool suite & anchor-cli 0.17.0

reference url to install is:
https://project-serum.github.io/anchor/getting-started/installation.html

## Configuration
- display network info
solana config get

- switch network
solana config set --url devnet
solana config set --url mainnet-beta

in Anchor.toml
change cluster to devnet or mainnet

- set paper wallet to use test-keypair.json
solana config set -k ./test-keypair.json

## Build, Deploy
- build project
anchor build

- deploy program
anchor deploy

- replace workspace with deployed program address
in Anchor.toml

...
vovo="deployed program id"

## Devnet Unit Tests
not prepared

## Mainnet Unit Tests

- create program state
anchor run test-create

- deposit
anchor run test-deposit

- earn
anchor run test-earn

- poke
anchor run test-poke

- withdraw
anchor run test-withdraw
