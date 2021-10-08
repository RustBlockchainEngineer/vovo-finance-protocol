var anchor = require('@project-serum/anchor');
var {Token} = require('@solana/spl-token');

var assert = require('assert')
const serumCmn = require("@project-serum/common");
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Commitment,
    Transaction
} = require("@solana/web3.js");

describe('vovo', () => {

    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    
});
