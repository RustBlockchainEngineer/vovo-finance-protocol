
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import  assert from "assert";
import * as serumCmn from "@project-serum/common";
import {TokenInstructions} from "@project-serum/serum";
import {
    PublicKey,
    Keypair,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { TestSender } from './helpers';
import { StableSwapNPool } from './mercurial';

describe('VovoSolana', () => {

    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.Vovo;
    const provider = program.provider;
    
    const wallet = provider.wallet.payer;
    const walletPubkey = wallet.publicKey;

    // it('withdraw', async () => {
    //   const programState = await program.state.fetch();
    //   const amount = new anchor.BN(5 * 1000000);

    //   const [userInfoAccount, userBump] = await PublicKey.findProgramAddress(
    //       [
    //           Buffer.from(anchor.utils.bytes.utf8.encode("vovo-user-seed")),
    //           walletPubkey.toBuffer(),
    //       ],
    //       program.programId
    //   );

    //   const userUSDCPubkey = new PublicKey(USER_USDC_ACCOUNT);


    //   const mercurialProgram = new PublicKey(MERCURIAL_PROGRAM);
    //     const mercurialSwapAccount = MERCURIAL_POOL_ACCOUNT.publicKey;

    //     const [mercurialPoolAuthority, _mercurial_nonce] = await PublicKey.findProgramAddress(
    //         [mercurialSwapAccount.toBuffer()],
    //         mercurialProgram
    //       )
    //     const mercurialTransferAuthority = programAuthority;
    //     const tokenPoolUsdc = programState.tokenPoolUsdc;
    //     const tokenPoolUsdt = programState.tokenPoolUsdt; 
    //     const tokenPoolWust = programState.tokenPoolWust;
        
    //   //step5
    //   await program.state.rpc.withdraw(
    //       amount,
    //       {
    //       accounts: {
    //         tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
    //         vovoData: program.state.address(),
    //         userInfo: userInfoAccount,
    //         to:userUSDCPubkey,

    //         poolAuthority:programState.authority,

    //         mercurialProgram,
    //         mercurialSwapAccount ,
    //         mercurialTokenProgramId:TOKEN_PROGRAM_ID ,
    //         mercurialPoolAuthority ,
    //         mercurialTransferAuthority,
    //         mercurialSwapTokenUsdc:swapUSDCTOken,
    //         mercurialSwapTokenUsdt:swapUSDTTOken,
    //         mercurialSwapTokenWust:swapwUSTTOken,
    //         mercurialPoolTokenMint:poolLpToken.publicKey,
    //         tokenPoolUsdc,
    //         tokenPoolUsdt,
    //         tokenPoolWust,
    //         mercurialLpToken
    //       }
    //   });
    // });
    
});
