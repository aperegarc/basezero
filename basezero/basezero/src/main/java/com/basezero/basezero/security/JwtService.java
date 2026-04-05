package com.basezero.basezero.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    // Access token: 15 minutos
    private static final long ACCESS_EXPIRATION = 1000 * 60 * 15;

    // Refresh token: 7 días
    private static final long REFRESH_EXPIRATION = 1000 * 60 * 60 * 24 * 7;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public String generateToken(UserDetails userDetails, Map<String, Object> extraClaims) {
        return buildToken(userDetails.getUsername(), extraClaims, ACCESS_EXPIRATION);
    }

    public String generateRefreshToken(String username) {
        return buildToken(username, Map.of("type", "refresh"), REFRESH_EXPIRATION);
    }

    private String buildToken(String subject, Map<String, Object> claims, long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            return extractUsername(token).equals(userDetails.getUsername())
                    && !getClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return getClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessExpiration() { return ACCESS_EXPIRATION; }
    public long getRefreshExpiration() { return REFRESH_EXPIRATION; }
}