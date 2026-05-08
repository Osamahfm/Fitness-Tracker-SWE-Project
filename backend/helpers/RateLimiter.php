<?php
/**
 * Rate Limiter Helper
 * Implements simple rate limiting for API endpoints
 */

class RateLimiter {
    private $cacheDir = __DIR__ . '/../../storage/rate_limit';
    
    public function __construct() {
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    /**
     * Check if request is rate limited
     */
    public function isLimited(string $identifier, int $limit = 5, int $window = 300): bool {
        $file = $this->cacheDir . '/' . hash('sha256', $identifier) . '.json';
        
        $now = time();
        $data = [];

        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true) ?? [];
            // Remove old entries outside the window
            $data = array_filter($data, function($timestamp) use ($now, $window) {
                return $now - $timestamp < $window;
            });
        }

        if (count($data) >= $limit) {
            return true;
        }

        // Add current request
        $data[$now] = $now;
        file_put_contents($file, json_encode($data));

        return false;
    }

    /**
     * Get remaining requests
     */
    public function getRemaining(string $identifier, int $limit = 5, int $window = 300): int {
        $file = $this->cacheDir . '/' . hash('sha256', $identifier) . '.json';
        
        $now = time();
        $data = [];

        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true) ?? [];
            $data = array_filter($data, function($timestamp) use ($now, $window) {
                return $now - $timestamp < $window;
            });
        }

        return max(0, $limit - count($data));
    }

    /**
     * Reset rate limit for identifier
     */
    public function reset(string $identifier): void {
        $file = $this->cacheDir . '/' . hash('sha256', $identifier) . '.json';
        if (file_exists($file)) {
            unlink($file);
        }
    }

    /**
     * Cleanup old rate limit files
     */
    public function cleanup(int $window = 300): void {
        $now = time();
        $files = glob($this->cacheDir . '/*.json');

        foreach ($files as $file) {
            $mtime = filemtime($file);
            if ($now - $mtime > $window) {
                unlink($file);
            }
        }
    }
}
