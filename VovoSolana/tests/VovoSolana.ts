import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { assert } from "chai";

import * as serumCmn from "@project-serum/common";
import {TokenInstructions} from "@project-serum/serum";
import {
    PublicKey,
    Keypair,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Commitment,
    Transaction
} from "@solana/web3.js";
import {SwapState} from "./mercurial_state";

const DEVNET_MODE = true;

const USER_WALLET = "EscNSusYYGAn69AZGjy8BpA4e9MXtvLeRCHJ3LK3b6vo";
const USER_MER_ACCOUNT = "E9domVp374m2Cn86WkDoJipAmRJhST3TJ4yem5L8rvoP";
const USER_USDC_ACCOUNT = "AdH5QunFC1x17zo4kF7R2wd1UAXsFo86TB2z9ZhUknCz";
const USER_MERCURIAL_LP_ACCOUNT = "5ne6EjcisdUwb8RE8WstP6pvKJGcPb9oCVDuR1XSwPBy";

const USDC_MINT_ADDRESS = DEVNET_MODE?"F2sTkVdLXGpRcBDi6Jg2UxKpAXtEPmbZQQMEJo9MXaGw":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MER_MINT_ADDRESS = DEVNET_MODE?"Ch4aKo9mBBuXAUqrkkTpLnopZGJmoMmEV43pQmqqKxrM":"MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K";

const MERCURIAL_PROGRAM = "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky";
const MERCURIAL_SWAP_ACCOUNT = "USD6kaowtDjwRkN5gAjw1PDMQvc9xRp8xW9GK8Z5HBA";
const MERCURIAL_LP_MINT = "57h4LEnBooHrKbacYWGCFghmrTzYPVn8PwZkzTzRLvHa";

const BONFIDA_PROGRAM = DEVNET_MODE?"3541FhgphoK6G1QKmEzdyxvKx8KyFjNkxsCN6UnjYyUU":"WvmTNLpGMVbwJVYztYL4Hnsy82cJhQorxjnnXcRm3b6";
const BONFIDA_MARKET_SOL = "jeVdn6rxFPLpCH9E6jmk39NTNx2zgTmKiVXBDiApXaV";
const BONFIDA_MARKET_VAULT_SOL = "LXMAV4hRP44N9VoL3XsSo3HqHP2kL1GxqwvJ8qGitv1";
const BONFIDA_MARKET_SIGNER_SOL = "G3zuVcG5uGvnw4dCAWeD7BvTo4CTt2vXsgUjqACnXLpN";
const BONFIDA_TARGET_SOL = USER_USDC_ACCOUNT;
const BONFIDA_SOURCE_OWNER = USER_WALLET;
const BONFIDA_SOURCE_TOKEN = USER_USDC_ACCOUNT;
const TRADE_LABEL = "TradeRecord11111111111111111111111111111111";

const BONFIDA_OPEN_POSITION_SOL = "CJ3XSni4VQjHR7mXD2ybtJFf99V14rzPG6QTAULDJrNX";

const DEFAULT_OPENPOSITIONS_CAPACITY = 128;
const BONFIDA_USER_ACCOUNT_SIZE = 80 + 43 * DEFAULT_OPENPOSITIONS_CAPACITY;

describe('VovoSolana', () => {

    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());

    const walletPubkey = new PublicKey(USER_WALLET);

    it('Is initialized!', async () => {
        // Add your test here.
        const program = anchor.workspace.Vovo;
        const provider = program.provider;

        const [poolSigner,nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [program.programId.toBuffer()],
            program.programId
        );
        const withdrawFee = new anchor.BN(10);
        const performanceFee = new anchor.BN(10);
        const leverage = new anchor.BN(15);
        const totalTradeProfit = new anchor.BN(0);

        const MERPubkey = new PublicKey(MER_MINT_ADDRESS);
        const USDCPubkey = new PublicKey(USDC_MINT_ADDRESS);

        const MERRewardTokenAccount = await serumCmn.createTokenAccount(
            provider,
            MERPubkey,
            poolSigner
        );
        const USDCRewardTokenAccount = await serumCmn.createTokenAccount(
            provider,
            USDCPubkey,
            poolSigner
        );
        const USDCPoolTokenAccount = await serumCmn.createTokenAccount(
            provider,
            USDCPubkey,
            poolSigner
        );
        
        const bonfidaProgramId = new PublicKey(BONFIDA_PROGRAM);
        const [userAccountKey] = await anchor.web3.PublicKey.findProgramAddress(
            [bonfidaProgramId.toBuffer(), walletPubkey.toBuffer()],
            bonfidaProgramId
        );
        await program.state.rpc.new(
            nonce, 
            withdrawFee, 
            performanceFee, 
            leverage, 
            totalTradeProfit,
            new anchor.BN(BONFIDA_USER_ACCOUNT_SIZE), 

            MERRewardTokenAccount,
            USDCRewardTokenAccount,
            {
                accounts:{
                    authority: walletPubkey,
                    tokenMint: USDCPubkey,
                    tokenPoolAccount: USDCPoolTokenAccount,

                    bonfidaProgramId: bonfidaProgramId,
                    userAccount: userAccountKey,
                    payer: walletPubkey,
                    rent: SYSVAR_RENT_PUBKEY,
                    system: SystemProgram.programId,
                }
            }
        );
        return true;
        const [userInfoAccount, userBump] = await PublicKey.findProgramAddress(
            [
                Buffer.from(anchor.utils.bytes.utf8.encode("vovo-user-seed")),
                walletPubkey.toBuffer(),
            ],
            program.programId
        );
        const userMERPubkey = new PublicKey(USER_MER_ACCOUNT);
        const userUSDCPubkey = new PublicKey(USER_USDC_ACCOUNT);

        let userInfo = await program.account.userInfo.fetch(userInfoAccount);
        if(!userInfo){
            await program.rpc.createUser(userBump, {
                accounts:{
                    userInfo:userInfoAccount,
                    owner: walletPubkey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram:anchor.web3.SystemProgram.programId
                }
            });
        }

        // step1 -  user deposits some USDC to pool
        await program.state.rpc.deposit(new anchor.BN(10 * 1000000), {
            accounts: {
                vovoData: program.state.address(),
                userInfo: userInfoAccount,
                from:userUSDCPubkey,
                tokenPoolAccount:USDCPoolTokenAccount,
                owner: walletPubkey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        });

        // step2 - no need
        // await program.state.rpc.addReward(new anchor.BN(5 * 1000000), {
        //     accounts: {
        //         vovoData: program.state.address(),
        //         from:userMERPubkey,
        //         tokenRewardAccount:MERRewardTokenAccount,
        //         owner: walletPubkey,
        //         tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
        //     }
        // });

        const mercurialProgram = new PublicKey(MERCURIAL_PROGRAM);
        const mercurialSwapAccount = new PublicKey(MERCURIAL_SWAP_ACCOUNT);
        const mercurialTokenProgramId = TokenInstructions.TOKEN_PROGRAM_ID;
        const [mercurialPoolAuthority, _mercurial_nonce] = await PublicKey.findProgramAddress(
            [mercurialSwapAccount.toBuffer()],
            mercurialProgram
          )
        const mercurialTransferAuthority = walletPubkey;
        const mercurialSwapToken = userUSDCPubkey;

        
        // const data = await loadAccount(provider, mercurialSwapAccount, mercurialProgram);
        // const swapState = SwapState.decode(data)
        // if (!swapState.isInitialized) {
        //     console.log(`Invalid mercurial swap state`)
        // }
        
        // const mercurialPoolToken_mint = swapState.poolMint;
        const mercurialPoolTokenMint = new PublicKey(MERCURIAL_LP_MINT);
        const tokenPool = USDCPoolTokenAccount;
        const mercurialLpToken = new PublicKey(USER_MERCURIAL_LP_ACCOUNT);

        // step3
        await program.state.rpc.earn(new anchor.BN(1 * 1000000), {
            accounts: {
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                vovoData: program.state.address(),

                mercurialProgram,
                mercurialSwapAccount ,
                mercurialTokenProgramId ,
                mercurialPoolAuthority ,
                mercurialTransferAuthority,
                mercurialSwapToken,
                mercurialPoolTokenMint,
                tokenPool,
                mercurialLpToken
            }
        });

        /*
        const minOutAmount = 1;
        const closingCollateral = 1200;
        const closingVCoin = 1;
        const positionIndex = 0;
        const predictedEntryPrice = 1;
        const maximumSlippageMargin = 1;

        const side = 0;
        const instanceIndex = 0;
        const collateral = 120;
        
        const audacesProtocolProgramId = new PublicKey(BONFIDA_PROGRAM);
        const marketAccount = new PublicKey(BONFIDA_MARKET_SOL);
        const marketSignerAccount = new PublicKey(BONFIDA_MARKET_SIGNER_SOL);
        const marketVault = new PublicKey(BONFIDA_MARKET_VAULT_SOL);
        const targetAccount = new PublicKey(BONFIDA_TARGET_SOL);
        const openPositionsOwnerAccount = walletPubkey;
        const oracleAccount = new PublicKey();
        const instanceAccount = new PublicKey();
        const userAccount = new PublicKey();
        const userAccountOwner = new PublicKey();
        const bonfidaBnb = new PublicKey();
        const memoryPage = new PublicKey();

        const sourceOwner = new PublicKey(BONFIDA_SOURCE_OWNER);
        const sourceTokenAccount = new PublicKey(BONFIDA_SOURCE_TOKEN);
        const openPositionsAccount = new PublicKey(BONFIDA_OPEN_POSITION_SOL);

        const clockSysvar = anchor.web3.SYSVAR_CLOCK_PUBKEY;
        const tradeLabel = new PublicKey(TRADE_LABEL);
        
        //step4
        await program.state.rpc.bonfidaPoke(
            new anchor.BN(minOutAmount),
            new anchor.BN(closingCollateral),
            new anchor.BN(closingVCoin),
            positionIndex,
            new anchor.BN(predictedEntryPrice),
            new anchor.BN(maximumSlippageMargin),
            side,
            instanceIndex,
            new anchor.BN(collateral),
            new anchor.BN(leverage),
            {
            accounts: {
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                vovoData: program.state.address(),

                mercurialProgram,
                mercurialSwapAccount ,
                mercurialTokenProgramId ,
                mercurialPoolAuthority ,
                mercurialTransferAuthority,
                mercurialSwapToken,
                mercurialPoolTokenMint,
                tokenPool,
                merRewardToken:MERRewardTokenAccount,
                usdcRewardToken:USDCRewardTokenAccount,


                audacesProtocolProgramId,
                marketAccount,
                marketSignerAccount,
                marketVault,
                targetAccount,
                openPositionsOwnerAccount,
                oracleAccount,
                instanceAccount,
                userAccount,
                userAccountOwner,
                bonfidaBnb,
                memoryPage,

                sourceOwner,
                sourceTokenAccount,
                openPositionsAccount,

                clockSysvar,
                tradeLabel,
            }
        });

        const amount = new anchor.BN(5 * 1000000);
        const minAmount =new anchor.BN(1 * 1000000);
        //step5
        await program.state.rpc.withdraw(
            amount,
            minAmount, 
            {
            accounts: {
                vovoData: program.state.address(),
                userInfo: userInfoAccount,
                to:userUSDCPubkey,
                tokenPoolAccount:USDCPoolTokenAccount,
                poolSigner:poolSigner,
                owner: walletPubkey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,

                mercurialProgram,
                mercurialSwapAccount ,
                mercurialTokenProgramId ,
                mercurialPoolAuthority ,
                mercurial_transfer_authority:poolSigner,
                mercurialSwapToken,
                mercurialPoolTokenMint,
                mercurialLpToken
            }
        });
        */
    });
    
});



async function loadAccount(provider, address, programId){
    const accountInfo = await provider.connection.getAccountInfo(address)
    if (accountInfo === null) {
      throw new Error('Failed to find account')
    }
  
    if (!accountInfo.owner.equals(programId)) {
      throw new Error(`Invalid owner: ${JSON.stringify(accountInfo.owner)}`)
    }
  
    return Buffer.from(accountInfo.data)
  }
  