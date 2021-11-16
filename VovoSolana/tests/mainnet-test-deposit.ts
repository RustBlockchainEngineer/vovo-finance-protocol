
import * as anchor from '@project-serum/anchor';
import {TokenInstructions} from "@project-serum/serum";
import {
    PublicKey,
} from "@solana/web3.js";
import { USER_USDC_ACCOUNT } from './mainnet-test-ids';

describe('VovoSolana', () => {

    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.Vovo;
    const provider = program.provider;
    
    const wallet = provider.wallet.payer;
    const walletPubkey = wallet.publicKey;
    
    it('deposit', async () => {
        // Add your test here.
        
        const [userInfoAccount, userBump] = await PublicKey.findProgramAddress(
            [
                Buffer.from(anchor.utils.bytes.utf8.encode("vovo-user-seed")),
                walletPubkey.toBuffer(),
            ],
            program.programId
        );
        const userUSDCPubkey = new PublicKey(USER_USDC_ACCOUNT);
        let userInfo = null;
        try{
            userInfo = await program.account.userInfo.fetch(userInfoAccount);
        }
        catch(e){
        }
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
        const programState = await program.state.fetch();
        // step1 -  user deposits some USDC to pool
        await program.state.rpc.deposit(new anchor.BN(7 * 1000000), {
            accounts: {
                userInfo: userInfoAccount,
                from:userUSDCPubkey,
                tokenPoolUsdcAccount:programState.tokenPoolUsdc,
                owner: walletPubkey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            }
        });
        
    });
});
