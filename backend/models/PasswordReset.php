<?php
/**
 * Secure password reset tokens (single-use, time-limited).
 */

require_once __DIR__ . '/../config/database.php';

class PasswordReset {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function createToken(string $email, string $tokenHash, string $expiresAt): bool {
        $sql = 'INSERT INTO password_resets (email, token_hash, expires_at) VALUES (:email, :token_hash, :expires_at)';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':email' => $email,
            ':token_hash' => $tokenHash,
            ':expires_at' => $expiresAt,
        ]);
    }

    public function consumeValidToken(string $plainToken): ?string {
        $hash = hash('sha256', $plainToken);

        $sql = 'SELECT reset_id, email FROM password_resets
                WHERE token_hash = :h AND used_at IS NULL AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':h' => $hash]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $upd = 'UPDATE password_resets SET used_at = NOW() WHERE reset_id = :id';
        $u = $this->db->prepare($upd);
        $u->execute([':id' => $row['reset_id']]);

        return $row['email'];
    }
}
