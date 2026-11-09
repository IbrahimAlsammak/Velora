package com.velora.backend.controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * POST /api/admin/uploads  (admin only) -> saves a product photo and returns its web address.
 * Photos are stored in the backend's "uploads" folder and served at /uploads/<name>.
 * (When the site goes online we may move photos to cloud storage.)
 */
@RestController
@RequestMapping("/api/admin/uploads")
public class UploadController {

    /** Only real image types allowed - checked by the file's first bytes, not just its name. */
    private static final Map<String, byte[]> SIGNATURES = Map.of(
            "jpg", new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "png", new byte[] {(byte) 0x89, 'P', 'N', 'G'},
            "webp", new byte[] {'R', 'I', 'F', 'F'});

    private final Path uploadDir;

    public UploadController(@Value("${velora.upload-dir}") String uploadDir) throws IOException {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a photo.");
        }
        String ext = detectType(file);
        // Random name: no clashes, and nobody can overwrite another photo
        String name = UUID.randomUUID() + "." + ext;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, uploadDir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        }
        return Map.of("url", "/uploads/" + name);
    }

    private String detectType(MultipartFile file) throws IOException {
        byte[] head = new byte[12];
        try (InputStream in = file.getInputStream()) {
            int read = in.readNBytes(head, 0, head.length);
            for (var entry : SIGNATURES.entrySet()) {
                byte[] sig = entry.getValue();
                if (read >= sig.length && startsWith(head, sig)) {
                    // WEBP files start with RIFF....WEBP
                    if (entry.getKey().equals("webp")
                            && !new String(head, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")) {
                        continue;
                    }
                    return entry.getKey();
                }
            }
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Only JPG, PNG or WEBP photos are allowed" + (original.isEmpty() ? "." : " (\"" + original + "\" isn't one)."));
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
