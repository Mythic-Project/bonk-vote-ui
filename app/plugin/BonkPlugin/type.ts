/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/bonk_plugin.json`.
 */
export type BonkPlugin = {
  "address": "EoKpGErCsD4UEbbY6LX4MLWBUjmoAxqKdU4fdtLuzK6M",
  "metadata": {
    "name": "bonkPlugin",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createRegistrar",
      "discriminator": [
        132,
        235,
        36,
        49,
        139,
        66,
        202,
        69
      ],
      "accounts": [
        {
          "name": "registrar",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "realm"
              },
              {
                "kind": "account",
                "path": "governingTokenMint"
              }
            ]
          }
        },
        {
          "name": "governanceProgramId"
        },
        {
          "name": "previousVoterWeightPluginProgramId",
          "optional": true
        },
        {
          "name": "realm"
        },
        {
          "name": "stakePool"
        },
        {
          "name": "governingTokenMint"
        },
        {
          "name": "realmAuthority",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createVoterWeightRecord",
      "discriminator": [
        184,
        249,
        133,
        178,
        88,
        152,
        250,
        186
      ],
      "accounts": [
        {
          "name": "registrar"
        },
        {
          "name": "voterWeightRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  119,
                  101,
                  105,
                  103,
                  104,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "registrar.realm",
                "account": "registrar"
              },
              {
                "kind": "account",
                "path": "registrar.governing_token_mint",
                "account": "registrar"
              },
              {
                "kind": "arg",
                "path": "governingTokenOwner"
              }
            ]
          }
        },
        {
          "name": "stakeDepositRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  45,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "voterWeightRecord"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "governingTokenOwner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateVoterWeightRecord",
      "discriminator": [
        45,
        185,
        3,
        36,
        109,
        190,
        115,
        169
      ],
      "accounts": [
        {
          "name": "registrar"
        },
        {
          "name": "inputVoterWeight",
          "docs": [
            "An account that is either of type TokenOwnerRecordV2 or VoterWeightRecord",
            "depending on whether the registrar includes a predecessor or not"
          ]
        },
        {
          "name": "voterWeightRecord",
          "writable": true
        },
        {
          "name": "stakeDepositRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  45,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "voterWeightRecord"
              }
            ]
          }
        },
        {
          "name": "voterTokenOwnerRecord"
        },
        {
          "name": "governance"
        },
        {
          "name": "proposal",
          "optional": true
        },
        {
          "name": "voterAuthority",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeReceiptsCount",
          "type": "u8"
        },
        {
          "name": "actionTarget",
          "type": "pubkey"
        },
        {
          "name": "action",
          "type": {
            "defined": {
              "name": "voterWeightAction"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "registrar",
      "discriminator": [
        193,
        202,
        205,
        51,
        78,
        168,
        150,
        128
      ]
    },
    {
      "name": "stakeDepositRecord",
      "discriminator": [
        111,
        36,
        227,
        41,
        149,
        207,
        98,
        20
      ]
    },
    {
      "name": "voterWeightRecord",
      "discriminator": [
        46,
        249,
        155,
        75,
        153,
        248,
        116,
        9
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidRealmAuthority",
      "msg": "Invalid Realm Authority"
    },
    {
      "code": 6001,
      "name": "invalidGoverningToken",
      "msg": "The mint of the stake pool is different from the realm"
    },
    {
      "code": 6002,
      "name": "invalidVoterWeightRecordRealm",
      "msg": "Invalid VoterWeightRecord Realm"
    },
    {
      "code": 6003,
      "name": "invalidVoterWeightRecordMint",
      "msg": "Invalid VoterWeightRecord Mint"
    },
    {
      "code": 6004,
      "name": "invalidStakePool",
      "msg": "Invalid Stake Pool"
    },
    {
      "code": 6005,
      "name": "invalidTokenOwnerForVoterWeightRecord",
      "msg": "Invalid TokenOwner for VoterWeightRecord"
    },
    {
      "code": 6006,
      "name": "voterDoesNotOwnDepositReceipt",
      "msg": "The owner of the receipt does not match"
    },
    {
      "code": 6007,
      "name": "duplicatedReceiptDetected",
      "msg": "The deposit receipt was already provided"
    },
    {
      "code": 6008,
      "name": "expiredStakeDepositReceipt",
      "msg": "The stake deposit receipt has already expired"
    },
    {
      "code": 6009,
      "name": "invalidStakeDuration",
      "msg": "The stake deposit receipt will expire before proposal"
    },
    {
      "code": 6010,
      "name": "receiptsCountMismatch",
      "msg": "The stake deposit receipts count does not match"
    },
    {
      "code": 6011,
      "name": "proposalAccountIsRequired",
      "msg": "Proposal account is required for Cast Vote action"
    },
    {
      "code": 6012,
      "name": "actionTargetMismatch",
      "msg": "Action target is different from the public key of the proposal"
    },
    {
      "code": 6013,
      "name": "maximumDepositsReached",
      "msg": "Maximum deposits length reached"
    }
  ],
  "types": [
    {
      "name": "registrar",
      "docs": [
        "Registrar which stores Token Voting configuration for the given Realm"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governanceProgramId",
            "type": "pubkey"
          },
          {
            "name": "realm",
            "type": "pubkey"
          },
          {
            "name": "realmAuthority",
            "type": "pubkey"
          },
          {
            "name": "governingTokenMint",
            "type": "pubkey"
          },
          {
            "name": "stakePool",
            "type": "pubkey"
          },
          {
            "name": "previousVoterWeightPluginProgramId",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "stakeDepositRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "deposits",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "weightActionTarget",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "weightAction",
            "type": {
              "option": {
                "defined": {
                  "name": "voterWeightAction"
                }
              }
            }
          },
          {
            "name": "depositsLen",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "previousVoterWeight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "voterWeightAction",
      "docs": [
        "VoterWeightAction enum as defined in spl-governance-addin-api",
        "It's redefined here for Anchor to export it to IDL"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "castVote"
          },
          {
            "name": "commentProposal"
          },
          {
            "name": "createGovernance"
          },
          {
            "name": "createProposal"
          },
          {
            "name": "signOffProposal"
          }
        ]
      }
    },
    {
      "name": "voterWeightRecord",
      "docs": [
        "VoterWeightRecord account as defined in spl-governance-addin-api",
        "It's redefined here without account_discriminator for Anchor to treat it as native account",
        "",
        "The account is used as an api interface to provide voting power to the governance program from external addin contracts"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "realm",
            "type": "pubkey"
          },
          {
            "name": "governingTokenMint",
            "type": "pubkey"
          },
          {
            "name": "governingTokenOwner",
            "type": "pubkey"
          },
          {
            "name": "voterWeight",
            "type": "u64"
          },
          {
            "name": "voterWeightExpiry",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "weightAction",
            "type": {
              "option": {
                "defined": {
                  "name": "voterWeightAction"
                }
              }
            }
          },
          {
            "name": "weightActionTarget",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "splTokenStakingProgramId",
      "type": "pubkey",
      "value": "STAKEkKzbdeKkqzKpLkNQD3SUuLgshDKCD7U8duxAbB"
    }
  ]
};
