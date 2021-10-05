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
    const program = anchor.workspace.Degenop;
    const mint = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112")
    const oracle = new anchor.web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix")
    console.log(program.programId)

    console.log(provider.wallet.publicKey.toString())
    console.log(mint)


    const [poolSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [mint.toBuffer()],
        program.programId
    );
    const writeMint = await createMint(provider, poolSigner);
    const userWriteMint = await serumCmn.createTokenAccount(
                                      provider,
                                      writeMint,
                                      provider.wallet.publicKey
                                  );

    const poolAccount = await serumCmn.createTokenAccount(
        provider,
        mint,
        poolSigner
    );
    // new anchor.web3.PublicKey("eybjPyLNxGSuWEtPAZbDuhZLhujtfct2hFzU5vD8YEL")
    const from = new anchor.web3.PublicKey("CeLevkWZshCNG4oP8Vxf14fqasF6Mi7j81tbRkXZDAsy")
    console.log("writeMint", writeMint.toString())
    console.log("mint", mint.toString())
    console.log("poolAccount", poolAccount.toString())
    console.log("userWriteMint", userWriteMint.toString())

    try {
        await program.state.rpc.new(nonce, {
            accounts: {
                authority: program.provider.wallet.publicKey,
                oracle,
                mint,
                poolAccount,
                poolSigner,
                writeMint,
            },
        });
    } catch (e) {

    }

    // create option
    const [optionPosition2, n2] = await PublicKey.findProgramAddress(
        [
            Buffer.from(anchor.utils.bytes.utf8.encode("option-position-seed")),
            from.toBuffer(),
            Buffer.from(Buffer.from([0]))
        ],
        program.programId
    );

    await program.rpc.createOption(0, n2, new anchor.BN(0.1 * 1000), new anchor.BN(1), new anchor.BN(1), {
        accounts: {
            optionPosition: optionPosition2,
            from,
            owner: program.provider.wallet.publicKey,
            degenop: program.state.address(),
            poolAccount,
            poolSigner,
            oracle,
            tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        }
    })

}

async function createMint(provider, authority) {
    if (authority === undefined) {
        authority = provider.wallet.publicKey;
    }
    const mint = anchor.web3.Keypair.generate();
    const instructions = await createMintInstructions(
        provider,
        authority,
        mint.publicKey
    );

    const tx = new anchor.web3.Transaction();
    tx.add(...instructions);

    await provider.send(tx, [mint]);

    return mint.publicKey;
}

async function createMintInstructions(provider, authority, mint) {
    let instructions = [
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: mint,
            space: 82,
            lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
            programId: TokenInstructions.TOKEN_PROGRAM_ID,
        }),
        TokenInstructions.initializeMint({
            mint,
            decimals: 6,
            mintAuthority: authority,
        }),
    ];
    return instructions;
}
