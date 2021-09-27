use {
    num_derive::FromPrimitive,
    solana_program::{
        decode_error::DecodeError,
        msg,
        program_error::{PrintProgramError, ProgramError},
    },
    thiserror::Error,
};

/// Errors that may be returned by the VovoVault program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum VovoVaultError {
    /// Account does not have correct owner
    #[error("Account does not have correct owner")]
    IncorrectOwner,

    /// Lamport balance below rent-exempt threshold.
    #[error("Lamport balance below rent-exempt threshold")]
    NotRentExempt,

    /// VovoVault account specified is invalid.
    #[error("VovoVault account specified is invalid.")]
    InvalidVovoVaultAccount,

    /// Balance too low to make bid.
    #[error("Balance too low to make bid.")]
    BalanceTooLow,

    /// Failed to derive an account from seeds.
    #[error("Failed to derive an account from seeds.")]
    DerivedKeyInvalid,

    /// Token transfer failed
    #[error("Token transfer failed")]
    TokenTransferFailed,

    /// Token mint to failed
    #[error("Token mint to failed")]
    TokenMintToFailed,

    /// Token burn failed
    #[error("Token burn failed")]
    TokenBurnFailed,

    /// Invalid authority
    #[error("Invalid authority")]
    InvalidAuthority,

    /// Authority not signer
    #[error("Authority not signer")]
    AuthorityNotSigner,

    /// Uninitialized
    #[error("Uninitialized")]
    Uninitialized,

    /// Metadata account is missing or invalid.
    #[error("Metadata account is missing or invalid.")]
    MetadataInvalid,

    /// Bidder pot is missing, and required for SPL trades.
    #[error("Bidder pot is missing, and required for SPL trades.")]
    BidderPotDoesNotExist,

    /// Existing Bid is already active.
    #[error("Existing Bid is already active.")]
    BidAlreadyActive,

    /// Incorrect mint specified, must match vault.
    #[error("Incorrect mint specified, must match vault.")]
    IncorrectMint,

    /// Must reveal price when ending a blinded vault.
    #[error("Must reveal price when ending a blinded vault.")]
    MustReveal,

    /// The revealing hash is invalid.
    #[error("The revealing hash is invalid.")]
    InvalidReveal,

    /// This is not a valid token program
    #[error(" This is not a valid token program")]
    InvalidTokenProgram,

    /// Data type mismatch
    #[error("Data type mismatch")]
    DataTypeMismatch,

    /// Invalid token pool address
    #[error("Invalid token pool address")]
    InvalidTokenPool,
}

impl PrintProgramError for VovoVaultError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<VovoVaultError> for ProgramError {
    fn from(e: VovoVaultError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for VovoVaultError {
    fn type_of() -> &'static str {
        "Vault Error"
    }
}
