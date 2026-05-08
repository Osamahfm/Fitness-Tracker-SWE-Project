<?php
/**
 * User Session Model Class
 * Handles user session management
 */

require_once __DIR__ . '/../config/database.php';

class UserSession {
    private $db;
    private $table = 'user_sessions';
    private $sessionDuration = 86400; // 24 hours in seconds

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new session
     */
    public function create(int $userId, string $ipAddress, string $userAgent): string {
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $this->sessionDuration);

        $query = "INSERT INTO {$this->table} 
                 (session_id, user_id, ip_address, user_agent, expires_at) 
                 VALUES (:session_id, :user_id, :ip_address, :user_agent, :expires_at)";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':ip_address', $ipAddress);
        $stmt->bindParam(':user_agent', $userAgent);
        $stmt->bindParam(':expires_at', $expiresAt);

        $stmt->execute();
        return $sessionId;
    }

    /**
     * Find valid session
     */
    public function findValid(string $sessionId, string $ipAddress): ?array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE session_id = :session_id 
                 AND ip_address = :ip_address 
                 AND expires_at > NOW() 
                 AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':ip_address', $ipAddress);
        $stmt->execute();

        $session = $stmt->fetch();
        return $session ?: null;
    }

    /**
     * Invalidate a session
     */
    public function invalidate(string $sessionId): bool {
        $query = "UPDATE {$this->table} 
                 SET is_active = FALSE 
                 WHERE session_id = :session_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        return $stmt->execute();
    }

    /**
     * Invalidate all sessions for a user except one
     */
    public function invalidateAllExcept(int $userId, string $exceptSessionId): bool {
        $query = "UPDATE {$this->table} 
                 SET is_active = FALSE 
                 WHERE user_id = :user_id 
                 AND session_id != :except_session_id 
                 AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':except_session_id', $exceptSessionId);
        return $stmt->execute();
    }

    /**
     * Clean up expired sessions
     */
    public function cleanupExpired(): int {
        $query = "UPDATE {$this->table} 
                 SET is_active = FALSE 
                 WHERE expires_at <= NOW() 
                 AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->rowCount();
    }

    /**
     * Extend session expiration
     */
    public function extend(string $sessionId): bool {
        $newExpiresAt = date('Y-m-d H:i:s', time() + $this->sessionDuration);
        
        $query = "UPDATE {$this->table} 
                 SET expires_at = :expires_at 
                 WHERE session_id = :session_id 
                 AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':expires_at', $newExpiresAt);
        return $stmt->execute();
    }
}
