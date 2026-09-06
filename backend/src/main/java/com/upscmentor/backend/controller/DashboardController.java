package com.upscmentor.backend.controller;

import com.upscmentor.backend.dto.dashboard.DashboardOverviewDto;
import com.upscmentor.backend.dto.dashboard.PriorityListsDto;
import com.upscmentor.backend.dto.dashboard.PyqCoverageDto;
import com.upscmentor.backend.dto.goal.GoalStatsDto;
import com.upscmentor.backend.security.AspirantContextResolver;
import com.upscmentor.backend.security.UserPrincipal;
import com.upscmentor.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Where Do I Stand?" (spec section 24) and the revision priority engine
 * (section 14). Both roles can read this - it's the mentor's main window
 * into the aspirant's actual state, not just self-reported progress.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AspirantContextResolver aspirantContextResolver;

    @GetMapping("/overview")
    public DashboardOverviewDto getOverview(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.getOverview(aspirantContextResolver.resolve(principal));
    }

    @GetMapping("/priorities")
    public PriorityListsDto getPriorities(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.getPriorities(aspirantContextResolver.resolve(principal));
    }

    @GetMapping("/pyq-coverage")
    public List<PyqCoverageDto> getPyqCoverage(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.getPyqCoverage(aspirantContextResolver.resolve(principal));
    }

    @GetMapping("/goal-stats")
    public GoalStatsDto getGoalStats(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.getGoalStats(aspirantContextResolver.resolve(principal));
    }
}
