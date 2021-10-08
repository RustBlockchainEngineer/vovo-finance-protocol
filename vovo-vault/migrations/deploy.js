var anchor = require('@project-serum/anchor');

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

module.exports = async function (provider) {
    // Configure client to use the provider.
    anchor.setProvider(provider);
    // Add your deploy script here.
    const program = anchor.workspace.Vovo;

    console.log(program.program_id)
}
