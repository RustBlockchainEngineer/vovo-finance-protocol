
import * as anchor from '@project-serum/anchor';
import  assert from "assert";
import * as serumCmn from "@project-serum/common";
import {
    PublicKey,
    Keypair,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { BONFIDA_PROGRAM, BONFIDA_USER_ACCOUNT_SIZE, MER_MINT_ADDRESS, USDC_MINT_ADDRESS, USDT_MINT_ADDRESS, wUST_MINT_ADDRESS } from './mainnet-test-ids';

describe('VovoSolana', () => { 

    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.Vovo;
    const provider = program.provider;
    
    const wallet = provider.wallet.payer;
    const walletPubkey = wallet.publicKey;

    it('Is initialized!', async () => {
        const [programAuthority,nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [program.programId.toBuffer()],
            program.programId
        );
        const withdrawFee = new anchor.BN(10);
        const performanceFee = new anchor.BN(10);
        const leverage = new anchor.BN(15);
        const totalTradeProfit = new anchor.BN(0);

        const MERPubkey = new PublicKey(MER_MINT_ADDRESS);
        const USDCPubkey = new PublicKey(USDC_MINT_ADDRESS);
        const USDTPubkey = new PublicKey(USDT_MINT_ADDRESS);
        const wUSTPubkey = new PublicKey(wUST_MINT_ADDRESS);

        const MERRewardTokenAccount = await serumCmn.createTokenAccount(
            provider,
            MERPubkey,
            programAuthority
        );
        const USDCRewardTokenAccount = await serumCmn.createTokenAccount(
            provider,
            USDCPubkey,
            programAuthority
        );
        const USDCPoolTokenAccount = await serumCmn.createTokenAccount(
            provider,
            USDCPubkey,
            programAuthority
        );
        const USDTPoolTokenAccount = await serumCmn.createTokenAccount(
            provider,
            USDTPubkey,
            programAuthority
        );
        const wUSTPoolTokenAccount = await serumCmn.createTokenAccount(
            provider,
            wUSTPubkey,
            programAuthority
        );
        
        const bonfidaProgramId = new PublicKey(BONFIDA_PROGRAM);
        const bonfidaUserAccount = new Keypair();

        let balance = await provider.connection.getMinimumBalanceForRentExemption(BONFIDA_USER_ACCOUNT_SIZE);

        const tx = new Transaction();
        const signers:Keypair[] = [];
        tx.feePayer = walletPubkey;
        tx.add(
            SystemProgram.createAccount({
                fromPubkey: walletPubkey,
                newAccountPubkey: bonfidaUserAccount.publicKey,
                lamports: balance,
                space: BONFIDA_USER_ACCOUNT_SIZE,
                programId: bonfidaProgramId,
            })
        );
        signers.push(wallet);
        signers.push(bonfidaUserAccount);
        const txResult = await provider.connection.sendTransaction(tx, signers, {
            preflightCommitment: "single",
        });
        console.log("creating user account", txResult);

        try{
            await program.state.rpc.new(
                nonce, 
                withdrawFee, 
                performanceFee, 
                leverage, 
                totalTradeProfit,
    
                MERRewardTokenAccount,
                USDCRewardTokenAccount,
                {
                    accounts:{
                        authority: walletPubkey,
                        tokenMint: USDCPubkey,
                        tokenPoolUsdcAccount: USDCPoolTokenAccount,
                        tokenPoolUsdtAccount: USDTPoolTokenAccount,
                        tokenPoolWustAccount: wUSTPoolTokenAccount,
                        bonfidaProgramId: bonfidaProgramId,
                        bonfidaUserAccount: bonfidaUserAccount.publicKey,
                    }
                }
            );
        }
        catch(e:any){
            const alreadyInUse = e.logs && e.logs[2] && e.logs[2].includes("already in use");
            assert.ok(alreadyInUse);
            alreadyInUse ? console.log("program state already created!"):console.log("creating program state error!");
        }
    });
});
