package com.shopkeeper.sales.dto;

import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {
    @NotBlank
    private String phone;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
