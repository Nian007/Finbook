package com.shopkeeper.sales.service;

import com.shopkeeper.sales.dto.JwtResponse;
import com.shopkeeper.sales.dto.LoginRequest;
import com.shopkeeper.sales.dto.SignupRequest;
import com.shopkeeper.sales.model.Business;
import com.shopkeeper.sales.model.RefreshToken;
import com.shopkeeper.sales.model.User;
import com.shopkeeper.sales.repository.BusinessRepository;
import com.shopkeeper.sales.repository.RefreshTokenRepository;
import com.shopkeeper.sales.repository.UserRepository;
import com.shopkeeper.sales.security.CustomUserDetails;
import com.shopkeeper.sales.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${shopledger.jwt.refreshExpirationMs:2592000000}") // 30 days
    private Long refreshTokenDurationMs;

    @Transactional
    public void registerBusiness(SignupRequest signUpRequest) {
        if (userRepository.findByPhone(signUpRequest.getPhone()).isPresent()) {
            throw new RuntimeException("Error: Phone number is already in use!");
        }

        Business business = new Business();
        business.setBusinessName(signUpRequest.getBusinessName());
        business.setOwnerName(signUpRequest.getOwnerName());
        business.setPhone(signUpRequest.getPhone());
        businessRepository.save(business);

        User user = new User();
        user.setBusiness(business);
        user.setName(signUpRequest.getOwnerName());
        user.setPhone(signUpRequest.getPhone());
        user.setEmail(signUpRequest.getEmail());
        System.out.println("Signup attempt with phone: " + signUpRequest.getPhone() + ", raw password: " + signUpRequest.getPassword());
        user.setPasswordHash(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole("owner");
        userRepository.save(user);
    }

    @Transactional
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getPhone(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        // Create Refresh Token
        RefreshToken refreshToken = createRefreshToken(user);

        return new JwtResponse(jwt,
                userDetails.getId(),
                user.getName(),
                userDetails.getUsername(),
                user.getRole(),
                user.getBusiness().getBusinessName());
    }
    
    public String getRefreshToken(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return createRefreshToken(user).getTokenHash();
    }

    private RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteAllByUser(user); // Invalidate old tokens for simplicity (single device login)

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setTokenHash(UUID.randomUUID().toString());

        refreshToken = refreshTokenRepository.save(refreshToken);
        return refreshToken;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByTokenHash(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiresAt().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    @Transactional
    public void logoutUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        refreshTokenRepository.deleteAllByUser(user);
    }
}
