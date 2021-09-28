const anchor = require('@project-serum/anchor');
const splToken = require('@solana/spl-token')
const { parseMappingData, parsePriceData, parseProductData } = require('@pythnetwork/client')
const moment = require('moment')
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Commitment,
  Transaction,
  Connection,
  clusterApiUrl
} = require("@solana/web3.js");
const serumCmn = require("@project-serum/common");
const connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl('devnet'),
    'confirmed',
);
const provider = new anchor.Provider(connection, anchor.Wallet.local(), anchor.Provider.defaultOptions())
anchor.setProvider(provider);

const program = anchor.workspace.Degenop;
const mint = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112")
const oracle = new anchor.web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix")
const poolAccount = new anchor.web3.PublicKey("J9epS9UXScd5RdsopgQaEHHUE8LjGSFDwYkgZxA9jKGk")
const owner = provider.wallet.publicKey
const writeMint = new anchor.web3.PublicKey("ACR8buQRCnWTesze75KyMP9vuvd2CM7ivDDATzf7m2X")
const userWriteMint = new anchor.web3.PublicKey("DE6xZt22RrPjB56Nfrh7VaXHmZELLQM8jzV1bJovQh6Q");

(async () => {
  const [poolSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [mint.toBuffer()],
      program.programId
  );


  let poolBalance = await serumCmn.getTokenAccount(provider, poolAccount)
  console.log("Pool has balance: ", getBalance(poolBalance.amount));
  const oraclePrice = await getOraclePrice()


  let allAccounts = await connection.getProgramAccounts(program.programId);
  allAccounts = await (await Promise.all(allAccounts.map(printOption))).filter((i) => i);
  allAccounts = await Promise.all(allAccounts.map(acc => calculatePnl(acc, oraclePrice)))
  console.log(allAccounts)

  await exerciseOption(allAccounts[1])

  async function createOption(size,
                              optionType,
                              hours) {
    // wrap sol into FROM
    const from = await splToken.Token.createWrappedNativeAccount(provider.connection, splToken.TOKEN_PROGRAM_ID, owner, provider.wallet.payer, size * 1000000000)

    const optionTypeInt = optionType === "put" ? 0 : 1;
    const [optionPosition, n] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("option-position-seed")),
          from.toBuffer(),
          Buffer.from(Buffer.from([0]))
        ],
        program.programId
    );
    const tx = await program.rpc.createOption(0, n, new anchor.BN(size * 1000), new anchor.BN(optionTypeInt), new anchor.BN(hours), {
      accounts: {
        optionPosition,
        from,
        owner: provider.wallet.publicKey,
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
    console.log("TX: ", tx)
  }

  async function exerciseOption(optionAccount) {
    if (optionAccount.dollarProfit < 0) {
      console.log("You can't exercise option cause it's in loss.")
      return
    }
    const [optionPosition, n] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("option-position-seed")),
          new anchor.web3.PublicKey(optionAccount.from).toBuffer(),
          Buffer.from(Buffer.from([0]))
        ],
        program.programId
    );
    const tx = await program.rpc.exerciseOption({
      accounts: {
        optionPosition,
        from: new anchor.web3.PublicKey(optionAccount.from),
        degenop: program.state.address(),
        poolAccount,
        poolSigner,
        oracle,
        tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      }
    })
    console.log("TX: ", tx)
  }
})();

async function printOption(account) {
  try {
    const optionAccount = await program.account.optionPosition.fetch(account.pubkey.toString())
    optionAccount.strike = getBalance(optionAccount.strike)
    optionAccount.size = parseInt(optionAccount.size.toString()) / 1000
    optionAccount.optionType = optionAccount.optionType === 0 ? "put":"call"
    optionAccount.from = optionAccount.from.toString()
    optionAccount.cost = getBalance(optionAccount.cost)
    optionAccount.account = account.pubkey.toString()
    optionAccount.openTs = moment.unix(parseInt(optionAccount.openTs.toString())).toISOString()
    optionAccount.isExpired = Math.floor(Date.now() / 1000) > optionAccount.expiresTs
    optionAccount.expiresTs = moment.unix(parseInt(optionAccount.expiresTs.toString())).toISOString()
    return optionAccount
  } catch (e) {
    if (e.toString().includes("Invalid account discriminator")) {
      return
    }
    console.log(e)
  }
}
async function getOraclePrice() {
  return connection.getAccountInfo(new anchor.web3.PublicKey("3Mnn2fX6rQyUsyELYms1sBJyChWofzSNRoqYzvgMVz5E")).then((accountInfo) => {
    const { product, priceAccountKey } = parseProductData(accountInfo.data)
    return connection.getAccountInfo(priceAccountKey).then((accountInfo) => {
      const { price, confidence } = parsePriceData(accountInfo.data)
      return price
    })
  })
}

async function calculatePnl(optionAccount, currentPrice) {
  const dollar_profit_per_option = optionAccount.optionType === "put" ? optionAccount.strike - currentPrice : currentPrice - optionAccount.strike;
  const dollar_profit = dollar_profit_per_option * optionAccount.size
  const token_profit = dollar_profit / currentPrice
  optionAccount.dollarProfit = dollar_profit;
  optionAccount.tokenProfit = token_profit;
  optionAccount.currentPrice = currentPrice;
  return optionAccount;
}

function getBalance(balance) {
  return parseInt(balance.toString())/ 10**9
}

