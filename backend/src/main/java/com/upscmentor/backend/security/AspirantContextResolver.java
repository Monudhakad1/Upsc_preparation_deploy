package com.upscmentor.backend.security;

import com.upscmentor.backend.entity.Role;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Every read in the app is scoped to "one aspirant's preparation data" (spec
 * section 33: a mentor should only ever see their linked aspirant, never
 * arbitrary data). This is the single place that decides whose data a
 * request resolves to, so every controller/service calls this instead of
 * re-deriving it ad hoc.
 */
@Component
public class AspirantContextResolver {

    public UUID resolve(UserPrincipal principal) {
        User user = principal.getUser();
        if (user.getRole() == Role.ASPIRANT) {
            return user.getId();
        }
        UUID linked = user.getLinkedAspirantId();
        if (linked == null) {
            throw new ApiException(HttpStatus.CONFLICT, "This mentor account isn't linked to an aspirant yet.");
        }
        return linked;
    }
}
