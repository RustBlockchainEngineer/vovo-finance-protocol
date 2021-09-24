use crate::errors::VovoVaultError;
use arrayref::array_ref;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo, borsh::try_from_slice_unchecked, clock::UnixTimestamp,
    entrypoint::ProgramResult, hash::Hash, msg, program_error::ProgramError, pubkey::Pubkey,
};
use std::{cell::Ref, cmp, mem};

// Declare submodules, each contains a single handler for each instruction variant in the program.
pub mod claim;
pub mod create_vault;
pub mod deposit;
pub mod set_authority;

// Re-export submodules handlers + associated types for other programs to consume.
pub use claim::*;
pub use create_vault::*;
pub use deposit::*;
pub use set_authority::*;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    use crate::instruction::VovoVaultInstruction;
    match VovoVaultInstruction::try_from_slice(input)? {
        VovoVaultInstruction::CreateVovoVault => create_vault(program_id, accounts),
        VovoVaultInstruction::Deposit(amount) => deposit(program_id, accounts, amount),
        VovoVaultInstruction::SetAuthority => set_authority(program_id, accounts),
        VovoVaultInstruction::Claim => claim(program_id, accounts),
    }
}

/// UserInfo
#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct UserInfo {
    pub owner: Pubkey,
    pub deposite_balance: u64,
}

impl UserInfo {
    pub fn from_account_info(a: &AccountInfo) -> Result<UserInfo, ProgramError> {
        let vault: UserInfo = try_from_slice_unchecked(&a.data.borrow_mut())?;

        Ok(vault)
    }
}

#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct VovoVaultData {
    /// Pubkey of the authority with permission to modify this vault.
    pub authority: Pubkey,
    /// Token mint for the SPL token being used to deposit
    pub token_mint: Pubkey,
    /// Token account to store all deposits
    pub token_pool: Pubkey,
    /// withdraw fee
    pub withdraw_fee: u64,
    /// performance fee
    pub performance_fee: u64,
    /// leverage
    pub leverage: u64,
    /// total farm reward
    pub total_farm_reward: u64,
    /// total trade profit
    pub total_trade_profit: u64,

}
impl VovoVaultData {
    pub fn from_account_info(a: &AccountInfo) -> Result<VovoVaultData, ProgramError> {
        let vault: VovoVaultData = try_from_slice_unchecked(&a.data.borrow_mut())?;

        Ok(vault)
    }
}
