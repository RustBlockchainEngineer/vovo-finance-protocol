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
const {
    SwapState
} = require("./mercurial_state");
const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MER_MINT_ADDRESS = "MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K";
const USER_MER_ACCOUNT = "MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K";
const USER_USDC_ACCOUNT = "MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K";

const MERCURIAL_PROGRAM = "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky";
const MERCURIAL_SWAP_ACCOUNT = "USD6kaowtDjwRkN5gAjw1PDMQvc9xRp8xW9GK8Z5HBA";
const MERCURIAL_LP_MINT = "USD6kaowtDjwRkN5gAjw1PDMQvc9xRp8xW9GK8Z5HBA";
const USER_LP_ACCOUNT = "USD6kaowtDjwRkN5gAjw1PDMQvc9xRp8xW9GK8Z5HBA";

const BONFIDA_PROGRAM = "WvmTNLpGMVbwJVYztYL4Hnsy82cJhQorxjnnXcRm3b6";

describe('vovo', () => {

    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());

    it('Is initialized!', async () => {
        // Add your test here.
        const program = anchor.workspace.Vovo;
        const provider = program.provider;

        const [poolSigner,nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [program.programId.toBuffer()],
            program.programId
        );
        const withdrawFee = 10;
        const performanceFee = 10;
        const leverage = 15;
        const totalTradeProfit = 0;

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
                    authority: program.provider.wallet.publicKey,
                    token_mint: USDCPubkey,
                    token_pool_account: USDCPoolTokenAccount,
                }
            }
        );

        const [userInfoAccount, userBump] = await PublicKey.findProgramAddress(
            [
                Buffer.from(anchor.utils.bytes.utf8.encode("vovo-user-seed")),
                wallet.publicKey.toBuffer(),
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
                    owner: wallet.publicKey,
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
                owner: program.provider.wallet.publicKey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        });

        // step2
        await program.state.rpc.addReward(new anchor.BN(5 * 1000000), {
            accounts: {
                vovoData: program.state.address(),
                from:userMERPubkey,
                tokenRewardAccount:MERRewardTokenAccount,
                owner: program.provider.wallet.publicKey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            }
        });

        const mercurialProgram = new PublicKey(MERCURIAL_PROGRAM);
        const mercurialSwapAccount = new PublicKey(MERCURIAL_SWAP_ACCOUNT);
        const mercurialTokenProgramId = TokenInstructions.TOKEN_PROGRAM_ID;
        const [mercurialPoolAuthority, nonce] = await PublicKey.findProgramAddress(
            [mercurialSwapAccount.toBuffer()],
            mercurialProgram
          )
        const mercurialTransferAuthority = provider.wallet.publicKey;
        const mercurialSwapToken = userUSDCPubkey;

        
        // const data = await loadAccount(provider, mercurialSwapAccount, mercurialProgram);
        // const swapState = SwapState.decode(data)
        // if (!swapState.isInitialized) {
        //     console.log(`Invalid mercurial swap state`)
        // }
        
        // const mercurialPoolToken_mint = swapState.poolMint;
        const mercurialPoolTokenMint = new PublicKey(MERCURIAL_LP_MINT);
        const tokenPool = USDCPoolTokenAccount;
        const mercurialLpToken = new PublicKey(USER_LP_ACCOUNT);

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
        
        const audacesProtocolProgramId = new PublicKey(BONFIDA_PROGRAM);
        const marketAccount = new PublicKey();
        const marketSignerAccount = new PublicKey();
        const marketVault = new PublicKey();
        const targetAccount = new PublicKey();
        const openPositionsOwnerAccount = new PublicKey();
        const oracleAccount = new PublicKey();
        const instanceAccount = new PublicKey();
        const userAccount = new PublicKey();
        const userAccountOwner = new PublicKey();
        const bonfidaBnb = new PublicKey();
        const memoryPage = new PublicKey();

        const sourceOwner = new PublicKey();
        const sourceTokenAccount = new PublicKey();
        const openPositionsAccount = new PublicKey();

        const clockSysvar = anchor.web3.SYSVAR_CLOCK_PUBKEY;
        const tradeLabel = new PublicKey();
        
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
                mercurialPoolToken_mint,
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
                owner: program.provider.wallet.publicKey,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,

                mercurialProgram,
                mercurialSwapAccount ,
                mercurialTokenProgramId ,
                mercurialPoolAuthority ,
                poolSigner,
                mercurialSwapToken,
                mercurialPoolToken_mint,
                mercurialLpToken
            }
        });
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
  