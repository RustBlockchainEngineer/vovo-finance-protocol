#![allow(warnings)]

pub mod errors;
pub mod utils;
pub mod constant;
pub mod entrypoint;
pub mod instruction;
pub mod processor;

/// Prefix used in PDA derivations to avoid collisions with other programs.
pub const PREFIX: &str = "vovovault";

solana_program::declare_id!("auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8");
