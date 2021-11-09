
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as serumCmn from "@project-serum/common";
import {
    PublicKey,
} from "@solana/web3.js";
import { MERCURIAL_POOL_ACCOUNT, MERCURIAL_PROGRAM } from './mainnet-test-ids';

describe('VovoSolana', () => {

    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.Vovo;
    const provider = program.provider;
    
    const wallet = provider.wallet.payer;
    const walletPubkey = wallet.publicKey;

    it('earn', async () => {

        const programState = await program.state.fetch();

        const [programAuthority,_nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [program.programId.toBuffer()],
            program.programId
        );
        
        const {poolLpToken, swapUSDCTOken, swapUSDTTOken, swapwUSTTOken} = await createMerurialSwapAccount(provider, wallet);
        
        const mercurialProgram = new PublicKey(MERCURIAL_PROGRAM);
        const mercurialSwapAccount = new PublicKey(MERCURIAL_POOL_ACCOUNT);

        const [mercurialPoolAuthority, _mercurial_nonce] = await PublicKey.findProgramAddress(
            [mercurialSwapAccount.toBuffer()],
            mercurialProgram
          )
        const mercurialTransferAuthority = programAuthority;
        const tokenPoolUsdc = programState.tokenPoolUsdc;
        const tokenPoolUsdt = programState.tokenPoolUsdt; 
        const tokenPoolWust = programState.tokenPoolWust;
        console.log("tokenPoolUsdc",tokenPoolUsdc.toBase58())

        const mercurialLpToken = await serumCmn.createTokenAccount(
            provider,
            poolLpToken.publicKey,
            programAuthority
        );
        console.log("call earn rpc");
        await program.state.rpc.earn(new anchor.BN(0 * 1000000), {
            accounts: {
                tokenProgram: TOKEN_PROGRAM_ID,
                vovoData: program.state.address(),
                mercurialProgram,
                mercurialSwapAccount ,
                mercurialTokenProgramId:TOKEN_PROGRAM_ID ,
                mercurialPoolAuthority ,
                mercurialTransferAuthority,
                mercurialSwapTokenUsdc:swapUSDCTOken,
                mercurialSwapTokenUsdt:swapUSDTTOken,
                mercurialSwapTokenWust:swapwUSTTOken,
                mercurialPoolTokenMint:poolLpToken.publicKey,
                tokenPoolUsdc,
                tokenPoolUsdt,
                tokenPoolWust,
                mercurialLpToken
            }
        });
    }); 

    
    
});
