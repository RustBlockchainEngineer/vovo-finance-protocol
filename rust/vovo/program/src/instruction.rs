use crate::{PREFIX};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    sysvar,
};

#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum VovoVaultInstruction {
    /// Create a new vault account bound to a resource, initially in a pending state.
    ///   0. `[signer]` The account creating the vault, which is authorised to make changes.
    ///   1. `[writable]` Uninitialized vault account.
    ///   2. `[]` Rent sysvar
    ///   3. `[]` System account
    CreateVovoVault,

    /// Update the authority for an vault account.
    SetAuthority,

    /// Place a bid on a running vault.
    ///   0. `[signer]` The depositors primary account, for PDA calculation/transit auth.
    ///   1. `[writable]` The depositors token account they'll pay with
    ///   2. `[writable]` The pot, containing a reference to the stored SPL token account.
    ///   3. `[writable]` The pot SPL account, where the tokens will be deposited.
    ///   4. `[writable]` The metadata account, storing information about the depositors actions.
    ///   5. `[writable]` VovoVault account, containing data about the vault and item being bid on.
    ///   6. `[writable]` Token mint, for transfer instructions and verification.
    ///   7. `[signer]` Transfer authority, for moving tokens into the bid pot.
    ///   8. `[signer]` Payer
    ///   9. `[]` Clock sysvar
    ///   10. `[]` Rent sysvar
    ///   11. `[]` System program
    ///   12. `[]` SPL Token Program
    Deposit(u64),

    /// Move SPL tokens from winning bid to the destination account.
    ///   0. `[writable]` The destination account
    ///   1. `[writable]` The depositor pot token account
    ///   2. `[]` The depositor pot pda account [seed of ['vault', program_id, vault key, depositor key]]
    ///   3. `[signer]` The authority on the vault
    ///   4. `[]` The vault
    ///   5. `[]` The depositor wallet
    ///   6. `[]` Token mint of the vault
    ///   7. `[]` Clock sysvar
    ///   8. `[]` Token program
    Claim,
}
