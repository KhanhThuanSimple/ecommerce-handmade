package com.handmade.handmade_api.modules.users.controller;

import com.handmade.handmade_api.modules.users.dto.UserPatchRequest;
import com.handmade.handmade_api.modules.users.dto.UserProfileResponse;
import com.handmade.handmade_api.modules.users.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserProfileResponse> patchUser(@PathVariable Long id, @RequestBody UserPatchRequest request) {
        return ResponseEntity.ok(userService.patchProfile(id, request));
    }
    
}
