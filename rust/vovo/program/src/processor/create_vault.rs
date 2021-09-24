use mem::size_of;

use crate::{
    errors::VovoVaultError,
    processor::{
        VovoVaultData,
    },
    constant::*,
    utils::{assert_derivation, assert_owned_by, create_or_allocate_account_raw, spl_token_create_account,TokenCreateAccount},
    PREFIX,
    
};

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        clock::UnixTimestamp,
        entrypoint::ProgramResult,
        msg,
        program_error::ProgramError,
        pubkey::Pubkey,
    },
    std::mem,
};

struct Accounts<'a, 'b: 'a> {
    payer: &'a AccountInfo<'b>,
    vault: &'a AccountInfo<'b>,
    token_mint: &'a AccountInfo<'b>,
    token_pool: &'a AccountInfo<'b>,
    authority: &'a AccountInfo<'b>,
    token_program: &'a AccountInfo<'b>,
    rent: &'a AccountInfo<'b>,
    system: &'a AccountInfo<'b>,
}

fn parse_accounts<'a, 'b: 'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'b>],
) -> Result<Accounts<'a, 'b>, ProgramError> {
    let account_iter = &mut accounts.iter();
    let accounts = Accounts {
        payer: next_account_info(account_iter)?,
        vault: next_account_info(account_iter)?,
        token_mint: next_account_info(account_iter)?,
        token_pool: next_account_info(account_iter)?,
        authority: next_account_info(account_iter)?,
        token_program: next_account_info(account_iter)?,
        rent: next_account_info(account_iter)?,
        system: next_account_info(account_iter)?,
    };
    Ok(accounts)
}
pub fn create_vault(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    msg!("+ Processing CreateVovoVault");
    let accounts = parse_accounts(program_id, accounts)?;

    let vault_seeds = [
        PREFIX.as_bytes(),
        program_id.as_ref(),
    ];

    // Derive the address we'll store the vault in, and confirm it matches what we expected the
    // user to provide.
    let (vault_key, bump) = Pubkey::find_program_address(&vault_seeds, program_id);
    if vault_key != *accounts.vault.key {
        return Err(VovoVaultError::InvalidVovoVaultAccount.into());
    }
    
    // The data must be large enough to hold at least the number of winners.
    let vault_size = mem::size_of::<VovoVaultData>();

    // Create vault account with enough space for a tickets tracking.
    create_or_allocate_account_raw(
        *program_id,
        accounts.vault,
        accounts.rent,
        accounts.system,
        accounts.payer,
        vault_size,
        &[
            PREFIX.as_bytes(),
            program_id.as_ref(),
            &[bump],
        ],
    )?;

    // Configure VovoVault.
    VovoVaultData {
        authority: *accounts.authority.key,
        token_mint: *accounts.token_mint.key,
        token_pool: *accounts.token_pool.key,
        withdraw_fee: WITHDRAWAL_FEE,
        performance_fee: PERFORMANCE_FEE,
        leverage: LEVERAGE,
        total_farm_reward: 0,
        total_trade_profit: 0,

    }
    .serialize(&mut *accounts.vault.data.borrow_mut())?;
    
    Ok(())
}