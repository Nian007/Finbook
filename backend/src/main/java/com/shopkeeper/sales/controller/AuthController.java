package com.shopkeeper.sales.controller;

import com.shopkeeper.sales.dto.JwtResponse;
import com.shopkeeper.sales.dto.LoginRequest;
import com.shopkeeper.sales.dto.SignupRequest;
import com.shopkeeper.sales.model.RefreshToken;
import com.shopkeeper.sales.model.User;
import com.shopkeeper.sales.security.CustomUserDetails;
import com.shopkeeper.sales.security.JwtUtils;
import com.shopkeeper.sales.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            authService.registerBusiness(signUpRequest);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User registered successfully!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        System.out.println("Login attempt with phone: " + loginRequest.getPhone() + ", password: " + loginRequest.getPassword());
        try {
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
            
            String refreshTokenStr = authService.getRefreshToken(jwtResponse.getId());
            
            Cookie cookie = new Cookie("shopledger_refresh", refreshTokenStr);
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // Set to true in prod with HTTPS
            cookie.setPath("/api/auth/refresh");
            cookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
            response.addCookie(cookie);

            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(HttpServletRequest request) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("shopledger_refresh")) {
                    refreshToken = cookie.getValue();
                }
            }
        }

        if (refreshToken != null) {
            return authService.findByToken(refreshToken)
                    .map(authService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        String token = jwtUtils.generateJwtTokenFromPhone(user.getPhone(), user.getBusiness().getId(), user.getRole());
                        return ResponseEntity.ok(new JwtResponse(token, user.getId(), user.getName(), user.getPhone(), user.getRole(), user.getBusiness().getBusinessName()));
                    })
                    .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token empty");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        try {
            CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            authService.logoutUser(userDetails.getId());
            return ResponseEntity.ok("Log out successful");
        } catch(Exception e) {
            return ResponseEntity.ok("Logged out locally"); // Might not have a valid context if token expired
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody com.shopkeeper.sales.dto.ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getPhone());
            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP sent successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody com.shopkeeper.sales.dto.ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getPhone(), request.getOtp(), request.getNewPassword());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
