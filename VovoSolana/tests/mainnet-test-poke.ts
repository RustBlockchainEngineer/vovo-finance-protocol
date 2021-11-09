
import * as anchor from '@project-serum/anchor';
import {TokenInstructions} from "@project-serum/serum";
import {
    PublicKey,
} from "@solana/web3.js";

describe('VovoSolana', () => {
    // At first , Prepare USDC, MER token accounts and amount in your wallet
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.Vovo;
    const provider = program.provider;
    
    const wallet = provider.wallet.payer;
    const walletPubkey = wallet.publicKey;

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

});
