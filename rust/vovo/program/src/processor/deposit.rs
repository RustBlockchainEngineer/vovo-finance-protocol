//! Buy a ticket on a running vault

use borsh::try_to_vec_with_schema;

use crate::{
    errors::VovoVaultError,
    processor::{
        VovoVaultData, UserInfo
    },
    utils::{
        assert_derivation, assert_initialized, assert_owned_by, assert_signer,
        assert_token_program_matches_package, create_or_allocate_account_raw, spl_token_transfer,
        TokenTransferParams,
    },
    PREFIX,
};

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::{invoke, invoke_signed},
        program_error::ProgramError,
        program_option::COption,
        program_pack::Pack,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction,
        system_instruction::create_account,
        sysvar::{clock::Clock, Sysvar},
    },
    spl_token::state::Account,
    std::mem,
};

struct Accounts<'a, 'b: 'a> {
    vault: &'a AccountInfo<'b>,
    depositor: &'a AccountInfo<'b>,
    depositor_info: &'a AccountInfo<'b>,
    depositor_token: &'a AccountInfo<'b>,
    pool_token: &'a AccountInfo<'b>,
    mint: &'a AccountInfo<'b>,
    transfer_authority: &'a AccountInfo<'b>,
    token_program: &'a AccountInfo<'b>,
}

fn parse_accounts<'a, 'b: 'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'b>],
) -> Result<Accounts<'a, 'b>, ProgramError> {
    let account_iter = &mut accounts.iter();
    let accounts = Accounts {
        vault: next_account_info(account_iter)?,
        depositor: next_account_info(account_iter)?,
        depositor_info: next_account_info(account_iter)?,
        depositor_token: next_account_info(account_iter)?,
        pool_token: next_account_info(account_iter)?,
        mint: next_account_info(account_iter)?,
        transfer_authority: next_account_info(account_iter)?,
        token_program: next_account_info(account_iter)?,
    };

    assert_owned_by(accounts.vault, program_id)?;
    assert_owned_by(accounts.depositor_info, program_id)?;
    assert_owned_by(accounts.depositor_token, &spl_token::id())?;

    assert_owned_by(accounts.mint, &spl_token::id())?;
    assert_signer(accounts.depositor)?;
    assert_signer(accounts.transfer_authority)?;
    assert_token_program_matches_package(accounts.token_program)?;

    if *accounts.token_program.key != spl_token::id() {
        return Err(VovoVaultError::InvalidTokenProgram.into());
    }

    Ok(accounts)
}

#[allow(clippy::absurd_extreme_comparisons)]
pub fn deposit<'r, 'b: 'r>(
    program_id: &Pubkey,
    accounts: &'r [AccountInfo<'b>],
    amount: u64
) -> ProgramResult {
    msg!("+ Processing Deposit");
    let accounts = parse_accounts(program_id, accounts)?;

    // Load the vault and verify this bid is valid.
    let mut vault = VovoVaultData::from_account_info(accounts.vault)?;

    if accounts.depositor_info.data_is_empty() {
        // create userinfo account
    }
    let mut user_info = UserInfo::from_account_info(accounts.depositor_info)?;

    let bump_authority_seeds = &[
        PREFIX.as_bytes(),
        program_id.as_ref(),
        accounts.vault.key.as_ref(),
        accounts.depositor.key.as_ref(),
    ];

    // Transfer amount of SPL token to bid account.
    spl_token_transfer(TokenTransferParams {
        source: accounts.depositor_token.clone(),
        destination: accounts.pool_token.clone(),
        authority: accounts.transfer_authority.clone(),
        authority_signer_seeds: bump_authority_seeds,
        token_program: accounts.token_program.clone(),
        amount: amount,
    })?;

    user_info.owner = *accounts.depositor_info.key;
    user_info.deposite_balance += amount;

    user_info.serialize(&mut *accounts.depositor_info.data.borrow_mut())?;
    vault.serialize(&mut *accounts.vault.data.borrow_mut())?;

    Ok(())
}
