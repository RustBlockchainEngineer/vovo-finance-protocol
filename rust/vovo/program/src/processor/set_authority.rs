//! Resets authority on an vault account.

use crate::{
    errors::VovoVaultError,
    processor::{VovoVaultData},
    utils::assert_owned_by,
    PREFIX,
};

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        pubkey::Pubkey,
    },
};

pub fn set_authority(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    msg!("+ Processing SetAuthority");
    let account_iter = &mut accounts.iter();
    let vault_act = next_account_info(account_iter)?;
    let current_authority = next_account_info(account_iter)?;
    let new_authority = next_account_info(account_iter)?;

    let mut vault = VovoVaultData::from_account_info(vault_act)?;
    assert_owned_by(vault_act, program_id)?;

    if vault.authority != *current_authority.key {
        return Err(VovoVaultError::InvalidAuthority.into());
    }

    if !current_authority.is_signer {
        return Err(VovoVaultError::InvalidAuthority.into());
    }

    // Make sure new authority actually exists in some form.
    if new_authority.data_is_empty() || new_authority.lamports() == 0 {
        msg!("Disallowing new authority because it does not exist.");
        return Err(VovoVaultError::InvalidAuthority.into());
    }

    vault.authority = *new_authority.key;
    vault.serialize(&mut *vault_act.data.borrow_mut())?;
    Ok(())
}
