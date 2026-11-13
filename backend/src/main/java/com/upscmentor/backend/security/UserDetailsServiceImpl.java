package com.upscmentor.backend.security;

import com.upscmentor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    /**
     * The JWT filter resolves the user on every request. With only two accounts
     * and a remote database, a short in-memory cache saves one DB round trip per
     * API call; 60s keeps changes (e.g. deactivating an account) close to live.
     */
    private static final long TTL_MS = 60_000;

    private record Entry(UserPrincipal principal, long loadedAt) {}

    private final Map<String, Entry> cache = new ConcurrentHashMap<>();
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String key = email.toLowerCase(Locale.ROOT);
        Entry hit = cache.get(key);
        long now = System.currentTimeMillis();
        if (hit != null && now - hit.loadedAt() < TTL_MS) {
            return hit.principal();
        }
        UserPrincipal principal = userRepository.findByEmailIgnoreCase(email)
                .map(UserPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("No account for " + email));
        cache.put(key, new Entry(principal, now));
        return principal;
    }

    /** Forget a cached account so a change (e.g. deactivation) applies on the next request. */
    public void evict(String email) {
        cache.remove(email.toLowerCase(Locale.ROOT));
    }
}
