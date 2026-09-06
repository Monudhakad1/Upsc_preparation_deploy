package com.upscmentor.backend.dto.question;

public record AttachmentDto(String fileName, String contentType, byte[] data) {}
