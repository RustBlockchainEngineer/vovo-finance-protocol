const anchor = require('@project-serum/anchor');
const splToken = require('@solana/spl-token')
const moment = require('moment')
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Commitment,
  Transaction,
  Connection,
  clusterApiUrl
} = require("@solana/web3.js");
const serumCmn = require("@project-serum/common");
const connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl('devnet'),
    'confirmed',
);
const provider = new anchor.Provider(connection, anchor.Wallet.local(), anchor.Provider.defaultOptions())
anchor.setProvider(provider);

const program = anchor.workspace.Vovo;

(async () => {
  
})();
