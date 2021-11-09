
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

//-------------------------User Information-----------------------------------------------------------------------------------------------------
const USER_WALLET = "EscNSusYYGAn69AZGjy8BpA4e9MXtvLeRCHJ3LK3b6vo";
const USER_MER_ACCOUNT = "E9domVp374m2Cn86WkDoJipAmRJhST3TJ4yem5L8rvoP";
const USER_USDC_ACCOUNT = "GtDXsNLWLkEbNSKSBrtF9v9UgVTMMAWgnk77d39rU54a";
const USER_USDT_ACCOUNT = "GUhW6vL3naidjxyq2ujYdKYho2o8nGzDXA9VCgFYNRY";
const USER_wUST_ACCOUNT = "3U6wr1kMgpTUKbfcwKsuH6XfFN97NywCE7gfFBQ6FY83";
//----------------------------------------------------------------------------------------------------------------------------------------------


//------------------------Token Addresses-------------------------------------------------------------------------------------------------------
const USDC_MINT_ADDRESS = "F2sTkVdLXGpRcBDi6Jg2UxKpAXtEPmbZQQMEJo9MXaGw";
const USDT_MINT_ADDRESS = "7vry9DfjJRNKSrFjx6Z7exftrmv4tMoYf5LQ8vqMKumQ";
const wUST_MINT_ADDRESS = "6EfU4qzfRE5SXiwYFD2suHt6xiz6VoKDmcYwS8oTZoXy";
const MER_MINT_ADDRESS = "Ch4aKo9mBBuXAUqrkkTpLnopZGJmoMmEV43pQmqqKxrM";
//----------------------------------------------------------------------------------------------------------------------------------------------


//-----------------------Mercurial Information--------------------------------------------------------------------------------------------------
const MERCURIAL_PROGRAM = "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky";
const MERCURIAL_POOL_ACCOUNT = Keypair.generate()
//----------------------------------------------------------------------------------------------------------------------------------------------


//-----------------------Bonfida Information--------------------------------------------------------------------------------------------------
const BONFIDA_PROGRAM = "3541FhgphoK6G1QKmEzdyxvKx8KyFjNkxsCN6UnjYyUU";
const DEFAULT_OPENPOSITIONS_CAPACITY = 3;
const BONFIDA_USER_ACCOUNT_SIZE = 80 + 43 * DEFAULT_OPENPOSITIONS_CAPACITY;
//----------------------------------------------------------------------------------------------------------------------------------------------


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

    it('deposit', async () => {
        // Add your test here.
        
        const [userInfoAccount, userBump] = await PublicKey.findProgramAddress(
            [
                Buffer.from(anchor.utils.bytes.utf8.encode("vovo-user-seed")),
                walletPubkey.toBuffer(),
            ],
            program.programId
        );
        const userMERPubkey = new PublicKey(USER_MER_ACCOUNT);
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
        await program.state.rpc.deposit(new anchor.BN(10 * 1000000), {
            accounts: {
                userInfo: userInfoAccount,
                from:userUSDCPubkey,
                tokenPoolUsdcAccount:programState.tokenPoolUsdc,
                owner: walletPubkey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            }
        });
        
    });
    
    it('earn', async () => {

        const programState = await program.state.fetch();

        const [programAuthority,_nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [program.programId.toBuffer()],
            program.programId
        );
        
        const {poolLpToken, swapUSDCTOken, swapUSDTTOken, swapwUSTTOken} = await createMerurialSwapAccount(provider, wallet);
        
        const mercurialProgram = new PublicKey(MERCURIAL_PROGRAM);
        const mercurialSwapAccount = MERCURIAL_POOL_ACCOUNT.publicKey;

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

    it('poke', async () => {
        const programState = await program.state.fetch();

        const raydiumProgramId = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")
        const raydiumAmmId = new PublicKey("BkfGDk676QFtTiGxn7TtEpHayJZRr6LgNk9uTV2MH4bR")
        const raydiumAmmAuthority = new PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1")
        const raydiumAmmOpenOrders = new PublicKey("FNwXaqyYNKNwJ8Qc39VGzuGnPcNTCVKExrgUKTLCcSzU")
        const raydiumAmmTargetOrders = new PublicKey("DKgXbNmsm1uCJ2eyh6xcnTe1G6YUav8RgzaxrbkG4xxe")
        const raydiumPoolCoinTokenAccount = new PublicKey("6XZ1hoJQZARtyA17mXkfnKSHWK2RvocC3UDNsY7f4Lf6")
        const raydiumPoolPcTokenAccount = new PublicKey("F4opwQUoVhVRaf3CpMuCPpWNcB9k3AXvMMsfQh52pa66")
        const raydiumSerumProgramId = new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin")
        const raydiumSerumMarket = new PublicKey("G4LcexdCzzJUKZfqyVDQFzpkjhB1JoCNL8Kooxi9nJz5")
        const raydiumSerumBids = new PublicKey("DVjhW8nLFWrpRwzaEi1fgJHJ5heMKddssrqE3AsGMCHp")
        const raydiumSerumAsks = new PublicKey("CY2gjuWxUFGcgeCy3UiureS3kmjgDSRF59AQH6TENtfC")
        const raydiumSerumEventQueue = new PublicKey("8w4n3fcajhgN8TF74j42ehWvbVJnck5cewpjwhRQpyyc")
        const raydiumSerumCoinVaultAccount = new PublicKey("4ctYuY4ZvCVRvF22QDw8LzUis9yrnupoLQNXxmZy1BGm")
        const raydiumSerumPcVaultAccount = new PublicKey("DovDds7NEzFn493DJ2yKBRgqsYgDXg6z38pUGXe1AAWQ")
        const raydiumSerumVaultSigner = new PublicKey("BUDJ4F1ZknbZiwHb6xHEsH6o1LuW394DE8wKT8CoAYNF")

        const userSourceTokenAccount = programState.merRewardToken
        const userDestinationTokenAccount = programState.usdcRewardToken
        const userSourceOwner = programState.authority
        
        const minOutAmount = 1;
        const closingCollateral = 1200;
        const closingVCoin = 1;
        const positionIndex = 0;
        const predictedEntryPrice = 1;
        const maximumSlippageMargin = 1;

        const side = 0;
        const instanceIndex = 0;
        const collateral = 120; 
        const leverage = 15;
        
        const audacesProtocolProgramId = new PublicKey("perpke6JybKfRDitCmnazpCrGN5JRApxxukhA9Js6E6");
        const marketAccount = new PublicKey("jeVdn6rxFPLpCH9E6jmk39NTNx2zgTmKiVXBDiApXaV");
        const marketSignerAccount = new PublicKey("G3zuVcG5uGvnw4dCAWeD7BvTo4CTt2vXsgUjqACnXLpN");
        const marketVault = new PublicKey("LXMAV4hRP44N9VoL3XsSo3HqHP2kL1GxqwvJ8qGitv1");
        const targetAccount = programState.usdcRewardToken;
        const openPositionsOwnerAccount = programState.authority;
        const oracleAccount = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
        const instanceAccount = new PublicKey("8RXoQA5tCA6dd4pKKKdBRELwGHcf9M4ESXoxAPRyGzxx");
        const userAccount = programState.bonfidaUserAccount;
        const userAccountOwner = programState.authority;
        const bonfidaBnb = new PublicKey("4qZA7RixzEgQ53cc6ittMeUtkaXgCnjZYkP8L1nxFD25");
        const memoryPage = new PublicKey("5jaD8e8b1fmqEg4N9o7gfvbgr9jA4PeBgWAfMKNYVLNq");

        const sourceOwner = programState.authority;
        const sourceTokenAccount = programState.usdcRewardToken;
        const openPositionsAccount = programState.bonfidaUserAccount;

        const clockSysvar = anchor.web3.SYSVAR_CLOCK_PUBKEY;
        const tradeLabel = new PublicKey("TradeRecord11111111111111111111111111111111");
        
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

                raydiumProgramId,
                raydiumAmmId,
                raydiumAmmAuthority,
                raydiumAmmOpenOrders,
                raydiumAmmTargetOrders,
                raydiumPoolCoinTokenAccount,
                raydiumPoolPcTokenAccount,
                raydiumSerumProgramId,
                raydiumSerumMarket,
                raydiumSerumBids,
                raydiumSerumAsks,
                raydiumSerumEventQueue,
                raydiumSerumCoinVaultAccount,
                raydiumSerumPcVaultAccount,
                raydiumSerumVaultSigner,

                userSourceTokenAccount,
                userDestinationTokenAccount,
                userSourceOwner,

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
    });

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

export async function createMerurialSwapAccount(provider:any, wallet:any) {
    const connection:anchor.web3.Connection = provider.connection;
    const payer = wallet;
    
    const tokenA = new Token(connection,new PublicKey(USDC_MINT_ADDRESS), TOKEN_PROGRAM_ID, wallet);
    
    const tokenB = new Token(connection,new PublicKey(USDT_MINT_ADDRESS), TOKEN_PROGRAM_ID, wallet);
    const tokenC = new Token(connection,new PublicKey(wUST_MINT_ADDRESS), TOKEN_PROGRAM_ID, wallet);

    const [authority, nonce] = await PublicKey.findProgramAddress(
      [MERCURIAL_POOL_ACCOUNT.publicKey.toBuffer()],
      new PublicKey(MERCURIAL_PROGRAM)
    )
    console.log("mercurial pool address - ", MERCURIAL_POOL_ACCOUNT.publicKey.toBase58())
    const amplificationCoefficient = 2000
    const feeNumerator = 4000000
    const adminFeeNumerator = 0
    console.log("tokenA.createAccount")
    const tokenAccountA = await tokenA.createAccount(authority)
    console.log("tokenB.createAccount")
    const tokenAccountB = await tokenB.createAccount(authority)
    const tokenAccountC = await tokenC.createAccount(authority)
    const tokenAccounts = [tokenAccountA, tokenAccountB, tokenAccountC]
        
    const poolLpToken = await Token.createMint(connection, payer, authority, null, 9, TOKEN_PROGRAM_ID)

    const adminToken = await Token.createMint(connection, payer, payer.publicKey, null, 0, TOKEN_PROGRAM_ID)
        console.log("StableSwapNPool.create")
    const stableSwapNPool = await StableSwapNPool.create(
      connection,
      new TestSender(payer),
      MERCURIAL_POOL_ACCOUNT,
      authority,
      tokenAccounts,
      poolLpToken.publicKey,
      adminToken.publicKey,
      nonce,
      amplificationCoefficient,
      feeNumerator,
      adminFeeNumerator,
      true,
      payer,
      new PublicKey(USER_WALLET)
    )

    const userLpTokenAccount = await serumCmn.createTokenAccount(
        provider,
        poolLpToken.publicKey,
        payer.publicKey
    );

    const vault = await StableSwapNPool.load(
        connection,
        stableSwapNPool.poolAccount,
        new PublicKey(USER_WALLET)
      )
    console.log("")
    console.log("vault.addLiquidity")
    console.log("vault.addLiquidity")
    const liquidity = 100 * 1000000;
    await vault.addLiquidity(
        new TestSender(payer),
        [new PublicKey(USER_USDC_ACCOUNT), new PublicKey(USER_USDT_ACCOUNT), new PublicKey(USER_wUST_ACCOUNT)],
        userLpTokenAccount,
        [liquidity, liquidity, liquidity],
        0, // TODO: This value to be roughly derived from inAmounts for the test
        []
      )

    return {poolLpToken: poolLpToken, swapUSDCTOken:tokenAccountA, swapUSDTTOken:tokenAccountB, swapwUSTTOken:tokenAccountC}
  }
