import CryptoJS from 'crypto-js';

export interface EncryptionResult {
  encrypted_content: string;
  metadata: {
    rows: number;
    columns: string[];
    timestamp: string;
    source: string;
    checksum: string;
  };
}

class EncryptionService {
  private readonly SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'hwo-default-secret-key-2024';

  /**
   * Encrypt CSV data with AES encryption
   */
  encryptCSVData(csvContent: string, source: string = 'satellite'): EncryptionResult {
    try {
      // Parse CSV to get metadata
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.length - 1; // Exclude header row

      // Create checksum for data integrity
      const checksum = CryptoJS.SHA256(csvContent).toString();

      // Encrypt the content
      const encrypted = CryptoJS.AES.encrypt(csvContent, this.SECRET_KEY).toString();

      return {
        encrypted_content: encrypted,
        metadata: {
          rows,
          columns: headers,
          timestamp: new Date().toISOString(),
          source,
          checksum
        }
      };
    } catch (error) {
      console.error('Error encrypting CSV data:', error);
      throw new Error('Failed to encrypt CSV data');
    }
  }

  /**
   * Decrypt CSV data
   */
  decryptCSVData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting CSV data:', error);
      throw new Error('Failed to decrypt CSV data');
    }
  }

  /**
   * Validate data integrity using checksum
   */
  validateDataIntegrity(csvContent: string, expectedChecksum: string): boolean {
    try {
      const actualChecksum = CryptoJS.SHA256(csvContent).toString();
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Error validating data integrity:', error);
      return false;
    }
  }

  /**
   * Process encrypted CSV file upload
   */
  async processEncryptedFile(file: File, source: string = 'satellite'): Promise<EncryptionResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvContent = event.target?.result as string;
          const encryptedData = this.encryptCSVData(csvContent, source);
          resolve(encryptedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Sanitize CSV data to prevent injection attacks
   */
  sanitizeCSVContent(csvContent: string): string {
    // Remove potentially dangerous content
    const dangerousPatterns = [
      /=\s*[A-Za-z]/g, // Formula injection
      /@\s*[A-Za-z]/g, // Command injection
      /\+\s*[A-Za-z]/g, // Plus injection
      /-\s*[A-Za-z]/g, // Minus injection
      /\t/g, // Tab characters
      /\r/g  // Carriage returns
    ];

    let sanitized = csvContent;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  /**
   * Validate CSV structure for satellite data
   */
  validateSatelliteCSVStructure(csvContent: string): {
    isValid: boolean;
    errors: string[];
    requiredColumns: string[];
  } {
    const requiredColumns = [
      'planet_name', 'ra', 'dec', 'distance', 
      'flux_ratio', 'signal_to_noise', 'timestamp'
    ];

    const errors: string[] = [];
    
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        errors.push('CSV must contain at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Check for required columns
      const missingColumns = requiredColumns.filter(col => 
        !headers.includes(col.toLowerCase())
      );
      
      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Validate data rows
      for (let i = 1; i < Math.min(lines.length, 10); i++) { // Check first 10 rows
        const row = lines[i].split(',');
        if (row.length !== headers.length) {
          errors.push(`Row ${i}: Column count mismatch`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        requiredColumns
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid CSV format'],
        requiredColumns
      };
    }
  }
}

export const encryptionService = new EncryptionService();
