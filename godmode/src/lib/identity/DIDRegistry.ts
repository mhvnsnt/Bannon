import crypto from 'crypto';

export class DIDRegistry {
  static async generateIdentity(agentType: string = "sub-agent"): Promise<{ did: string, keys: any }> {
    console.log(`[DID Registry] Generating autonomous W3C Decentralized Identifier for ${agentType}...`);
    
    // Generate Ed25519 keypair for the agent
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    
    const pubKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
    const did = `did:web:godmode-os-${agentType}-${crypto.randomBytes(4).toString('hex')}`;
    
    console.log(`[DID Registry] Identity locked: ${did}`);
    return { did, keys: { publicKey: pubKeyBase64, privateKey } };
  }
}

export class DIDWallet {
  static async signCredential(did: string, privateKey: crypto.KeyObject, payload: any) {
    console.log(`[DIDWallet] Signing verifiable credential with DID: ${did} for secure agent-to-agent communication...`);
    
    const payloadString = JSON.stringify(payload);
    const signature = crypto.sign(null, Buffer.from(payloadString), privateKey);

    return {
      issuer: did,
      issuanceDate: new Date().toISOString(),
      credentialSubject: payload,
      proof: {
        type: "Ed25519Signature2020",
        created: new Date().toISOString(),
        proofPurpose: "assertionMethod",
        verificationMethod: `${did}#keys-1`,
        signatureValue: signature.toString('base64')
      }
    };
  }

  static async verifyCredential(credential: any, publicKeyBase64: string): Promise<boolean> {
      console.log(`[DIDWallet] Verifying credential from issuer: ${credential.issuer}...`);
      try {
          const payloadString = JSON.stringify(credential.credentialSubject);
          const publicKey = crypto.createPublicKey({
             key: Buffer.from(publicKeyBase64, 'base64'),
             format: 'der',
             type: 'spki'
          });

          const isValid = crypto.verify(
              null,
              Buffer.from(payloadString),
              publicKey,
              Buffer.from(credential.proof.signatureValue, 'base64')
          );
          
          if (isValid) {
             console.log(`[DIDWallet] Verifiable credential signature is valid.`);
          } else {
             console.warn(`[DIDWallet] Verifiable credential signature verification FAILED.`);
          }
          return isValid;
      } catch (e: any) {
          console.error(`[DIDWallet] Error verifying credential: ${e.message}`);
          return false;
      }
  }
}
