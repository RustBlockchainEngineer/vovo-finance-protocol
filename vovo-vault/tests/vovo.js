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

describe('degenop', () => {

    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    it('Is initialized!', async () => {
        // Add your test here.
        const program = anchor.workspace.Degenop;
        const pyth = anchor.workspace.Pyth;

        const priceFeed = await createPriceFeed(pyth, 30, null, -9) // current price of sol is 30.00
        const provider = program.provider;
        const [mint, god] = await serumCmn.createMintAndVault(
            provider,
            new anchor.BN(1000 * 1000000000), // mint 1000 SOL to GOD
        );
        let godBalance = await serumCmn.getTokenAccount(provider, god)
        console.log("god now has token: ", godBalance.amount.toString());

        const [poolSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [mint.toBuffer()],
            program.programId
        );

        const writeMint = await createMint(provider, poolSigner);

        const poolAccount = await serumCmn.createTokenAccount(
            provider,
            mint,
            poolSigner
        );

        const userWriteMint = await serumCmn.createTokenAccount(
            provider,
            writeMint,
            provider.wallet.publicKey
        );

        await program.state.rpc.new(nonce, {
            accounts: {
                authority: program.provider.wallet.publicKey,
                oracle: priceFeed,
                mint,
                poolAccount,
                poolSigner,
                writeMint,
            },
        });

        // deposit 1000 SOL
        await program.state.rpc.deposit(new anchor.BN(1000 * 1000000000), {
            accounts: {
                degenop: program.state.address(),
                from: god,
                poolAccount,
                owner: program.provider.wallet.publicKey,
                writeMint,
                userWriteMint,
                poolSigner,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        })

        let userWrtBalance = await serumCmn.getTokenAccount(provider, userWriteMint)

        // mint 1000 SOL to pool
        console.log("user now has writeToken: ", userWrtBalance.amount.toString());
        const tx = new Transaction()
        tx.add(TokenInstructions.mintTo({
            mint: mint,
            destination: poolAccount,
            amount: 1000 * 1000000000,
            mintAuthority: provider.wallet.publicKey,
        }));
        await provider.send(tx);
        // withdraw
        await program.state.rpc.withdraw(new anchor.BN(userWrtBalance.amount), {
            accounts: {
                degenop: program.state.address(),
                to: god,
                owner: program.provider.wallet.publicKey,
                poolAccount,
                writeMint,
                userWriteMint,
                poolSigner,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        })
        userWrtBalance = await serumCmn.getTokenAccount(provider, userWriteMint)
        console.log("user now has writeToken: ", userWrtBalance.amount.toString());
        godBalance = await serumCmn.getTokenAccount(provider, god)
        console.log("god now has token: ", godBalance.amount.toString());

        // create option
        const optionType = new anchor.BN(0)
        const [optionPosition, n] = await PublicKey.findProgramAddress(
            [
                Buffer.from(anchor.utils.bytes.utf8.encode("option-position-seed")),
                god.toBuffer(),
                Buffer.from(Buffer.from([1]))
            ],
            program.programId
        );

        // mint 5000 SOL to pool so god can win something..
        console.log("user now has writeToken: ", userWrtBalance.amount.toString());
        const tx2 = new Transaction()
        tx2.add(TokenInstructions.mintTo({
            mint: mint,
            destination: poolAccount,
            amount: 5000 * 1000000000,
            mintAuthority: provider.wallet.publicKey,
        }));
        await provider.send(tx2);

        // god spend 10 sol buying call option!
        await program.rpc.createOption(1, n, new anchor.BN(10 * 1000), optionType, new anchor.BN(1), {
            accounts: {
                optionPosition,
                from: god,
                owner: program.provider.wallet.publicKey,
                degenop: program.state.address(),
                poolAccount,
                poolSigner,
                oracle: priceFeed,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            }
        })
        let optionAccount = await program.account.optionPosition.fetch(optionPosition)
        console.log("option account", JSON.stringify(optionAccount))
        godBalance = await serumCmn.getTokenAccount(provider, god)
        console.log("after opened god now has token: ", godBalance.amount.toString());

        // update oracle price
        await setFeedPrice(pyth, 33.3, priceFeed, -9)


        await assert.rejects(
              async () => {
                    await program.rpc.exerciseOption({
                        accounts: {
                            optionPosition,
                            from: god,
                            owner: program.provider.wallet.publicKey,
                            degenop: program.state.address(),
                            poolAccount,
                            poolSigner,
                            oracle: priceFeed,
                            tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                        }
                    })
              },
              (err) => {
                assert.ok(
                  err.toString() === `Option under water`
                );
                return true;
              }
        );

        godBalance = await serumCmn.getTokenAccount(provider, god)
        console.log("god now has token: ", godBalance.amount.toString());
        optionAccount = await program.account.optionPosition.fetch(optionPosition)
        console.log(JSON.stringify(optionAccount))
        // update oracle price
        console.log(god.toString(), optionPosition.toString())
        await setFeedPrice(pyth, 25, priceFeed, -9)
        await program.rpc.exerciseOption({
            accounts: {
                optionPosition,
                from: god,
                owner: program.provider.wallet.publicKey,
                degenop: program.state.address(),
                poolAccount,
                poolSigner,
                oracle: priceFeed,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            },
        })
        godBalance = await serumCmn.getTokenAccount(provider, god)
        console.log("god now has token: ", godBalance.amount.toString());
        optionAccount = await program.account.optionPosition.fetch(optionPosition)
        console.log(JSON.stringify(optionAccount))


        // create second option
        const [optionPosition2, n2] = await PublicKey.findProgramAddress(
            [
                Buffer.from(anchor.utils.bytes.utf8.encode("option-position-seed")),
                god.toBuffer(),
                Buffer.from(Buffer.from([2]))
            ],
            program.programId
        );
        // god spend 10 sol buying call option!
        await program.rpc.createOption(2, n2, new anchor.BN(10 * 1000), optionType, new anchor.BN(1), {
            accounts: {
                optionPosition: optionPosition2,
                from: god,
                owner: program.provider.wallet.publicKey,
                degenop: program.state.address(),
                poolAccount,
                poolSigner,
                oracle: priceFeed,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            },
        })

    });
});

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


async function createPriceFeed(
    oracleProgram,
    initPrice,
    confidence,
    expo = -4,
) {
    const conf = confidence || new anchor.BN((initPrice / 10) * 10 ** -expo)
    const collateralTokenFeed = new anchor.web3.Account()
    await oracleProgram.rpc.initialize(new anchor.BN(initPrice * 10 ** -expo), expo, conf, {
        accounts: {price: collateralTokenFeed.publicKey},
        signers: [collateralTokenFeed],
        instructions: [
            SystemProgram.createAccount({
                fromPubkey: oracleProgram.provider.wallet.publicKey,
                newAccountPubkey: collateralTokenFeed.publicKey,
                space: 3312,
                lamports: await oracleProgram.provider.connection.getMinimumBalanceForRentExemption(3312),
                programId: oracleProgram.programId,
            }),
        ],
    })
    return collateralTokenFeed.publicKey
}

async function setFeedPrice(
    oracleProgram,
    newPrice,
    priceFeed,
    exponent
) {
    const info = await oracleProgram.provider.connection.getAccountInfo(priceFeed)
    await oracleProgram.rpc.setPrice(new anchor.BN(newPrice * 10 ** -exponent), {
        accounts: {price: priceFeed},
    })
}