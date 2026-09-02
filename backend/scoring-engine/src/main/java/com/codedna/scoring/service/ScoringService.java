package com.codedna.scoring.service;

import com.codedna.common.event.DnaCalculatedEvent;
import com.codedna.common.model.DnaProfile;
import com.codedna.common.model.Repository;
import com.codedna.common.model.Skill;
import com.codedna.scoring.entity.DnaProfileEntity;
import com.codedna.scoring.repository.DnaProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringService {

    private final DnaProfileRepository profileRepository;
    private final KafkaTemplate<String, DnaCalculatedEvent> kafkaTemplate;
    private final RestTemplate restTemplate;
    private static final String REPOSITORY_SERVICE_URL = "http://localhost:8082/api/v1/repositories";

    @Transactional
    public DnaProfile calculateDnaScore(Long userId) {
        log.info("Calculating DNA score for user: {}", userId);

        // Fetch user repositories
        String url = REPOSITORY_SERVICE_URL + "/user/" + userId;
        Repository[] repositories = restTemplate.getForObject(url, Repository[].class);

        if (repositories == null || repositories.length == 0) {
            return createDefaultProfile(userId);
        }

        List<Repository> repoList = Arrays.asList(repositories);

        // Calculate skills
        List<Skill> languageSkills = calculateLanguageSkills(repoList);
        List<Skill> engineeringSkills = calculateEngineeringSkills(repoList);
        List<Skill> radialSkills = combineRadialSkills(languageSkills, engineeringSkills);

        // Calculate overall score
        int score = calculateOverallScore(languageSkills, engineeringSkills);
        String label = determineLabel(score);
        String archetype = determineArchetype(repoList, languageSkills);
        String strongestArea = findStrongestArea(radialSkills);
        String recommendedSkill = determineRecommendedSkill(languageSkills);

        // Save to database
        DnaProfileEntity entity = profileRepository.findByUserId(userId)
                .orElse(new DnaProfileEntity());

        Integer previousScore = entity.getScore();

        entity.setUserId(userId);
        entity.setScore(score);
        entity.setLabel(label);
        entity.setStrongestArea(strongestArea);
        entity.setRecommendedSkill(recommendedSkill);
        entity.setArchetype(archetype);
        entity.setCalculatedAt(LocalDateTime.now());

        entity = profileRepository.save(entity);

        // Publish event
        DnaCalculatedEvent event = DnaCalculatedEvent.builder()
                .userId(userId)
                .previousScore(previousScore)
                .newScore(score)
                .label(label)
                .calculatedAt(LocalDateTime.now())
                .build();

        kafkaTemplate.send("dna.calculated", event);
        log.info("DNA score calculated: {} for user {}", score, userId);

        return DnaProfile.builder()
                .id(entity.getId())
                .userId(userId)
                .score(score)
                .label(label)
                .strongestArea(strongestArea)
                .recommendedSkill(recommendedSkill)
                .archetype(archetype)
                .languages(languageSkills)
                .engineering(engineeringSkills)
                .radial(radialSkills)
                .calculatedAt(entity.getCalculatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public DnaProfile getUserDnaProfile(Long userId) {
        DnaProfileEntity entity = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("DNA profile not found"));

        return DnaProfile.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .score(entity.getScore())
                .label(entity.getLabel())
                .strongestArea(entity.getStrongestArea())
                .recommendedSkill(entity.getRecommendedSkill())
                .archetype(entity.getArchetype())
                .calculatedAt(entity.getCalculatedAt())
                .build();
    }

    private List<Skill> calculateLanguageSkills(List<Repository> repos) {
        Map<String, Integer> languageCount = new HashMap<>();

        for (Repository repo : repos) {
            if (repo.getPrimaryLanguage() != null) {
                languageCount.merge(repo.getPrimaryLanguage(), repo.getCommits(), Integer::sum);
            }
            if (repo.getLanguages() != null) {
                for (String lang : repo.getLanguages()) {
                    languageCount.merge(lang, repo.getCommits() / 2, Integer::sum);
                }
            }
        }

        int max = languageCount.values().stream().mapToInt(Integer::intValue).max().orElse(1);

        return languageCount.entrySet().stream()
                .map(e -> Skill.builder()
                        .name(e.getKey())
                        .value((int) ((e.getValue() * 100.0) / max))
                        .category("language")
                        .trend(new Random().nextInt(10) - 2)
                        .build())
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(8)
                .collect(Collectors.toList());
    }

    private List<Skill> calculateEngineeringSkills(List<Repository> repos) {
        int avgQuality = (int) repos.stream()
                .filter(r -> r.getHealth() != null)
                .mapToInt(r -> r.getHealth().getCodeQuality())
                .average()
                .orElse(70);

        int avgTesting = (int) repos.stream()
                .filter(r -> r.getHealth() != null)
                .mapToInt(r -> r.getHealth().getTesting())
                .average()
                .orElse(65);

        int avgDocs = (int) repos.stream()
                .filter(r -> r.getHealth() != null)
                .mapToInt(r -> r.getHealth().getDocumentation())
                .average()
                .orElse(60);

        int avgMaintain = (int) repos.stream()
                .filter(r -> r.getHealth() != null)
                .mapToInt(r -> r.getHealth().getMaintainability())
                .average()
                .orElse(75);

        return Arrays.asList(
                Skill.builder().name("Collaboration").value(84).category("collaboration").trend(2).build(),
                Skill.builder().name("Architecture").value(avgMaintain).category("engineering").trend(3).build(),
                Skill.builder().name("Testing").value(avgTesting).category("engineering").trend(5).build(),
                Skill.builder().name("Documentation").value(avgDocs).category("engineering").trend(-2).build()
        );
    }

    private List<Skill> combineRadialSkills(List<Skill> languages, List<Skill> engineering) {
        List<Skill> radial = new ArrayList<>();
        radial.addAll(languages.stream().limit(4).collect(Collectors.toList()));
        radial.addAll(engineering);
        return radial;
    }

    private int calculateOverallScore(List<Skill> languages, List<Skill> engineering) {
        int langAvg = (int) languages.stream().mapToInt(Skill::getValue).average().orElse(0);
        int engAvg = (int) engineering.stream().mapToInt(Skill::getValue).average().orElse(0);
        return (int) ((langAvg * 0.6) + (engAvg * 0.4));
    }

    private String determineLabel(int score) {
        if (score >= 85) return "Expert Developer";
        if (score >= 75) return "Strong Backend Engineer";
        if (score >= 65) return "Proficient Developer";
        if (score >= 50) return "Intermediate Developer";
        return "Junior Developer";
    }

    private String determineArchetype(List<Repository> repos, List<Skill> languages) {
        if (!languages.isEmpty()) {
            String topLang = languages.get(0).getName();
            if (topLang.equals("Java") || topLang.equals("Python")) {
                return "Systems Builder";
            }
            if (topLang.equals("TypeScript") || topLang.equals("JavaScript")) {
                return "Full-Stack Creator";
            }
        }
        return "Generalist";
    }

    private String findStrongestArea(List<Skill> skills) {
        return skills.stream()
                .max(Comparator.comparingInt(Skill::getValue))
                .map(Skill::getName)
                .orElse("Backend Development");
    }

    private String determineRecommendedSkill(List<Skill> languages) {
        if (languages.stream().noneMatch(s -> s.getName().equals("Kubernetes"))) {
            return "Kubernetes";
        }
        return "Distributed Systems";
    }

    private DnaProfile createDefaultProfile(Long userId) {
        return DnaProfile.builder()
                .userId(userId)
                .score(50)
                .label("New Developer")
                .strongestArea("Getting Started")
                .recommendedSkill("Version Control")
                .archetype("Learner")
                .languages(Collections.emptyList())
                .engineering(Collections.emptyList())
                .radial(Collections.emptyList())
                .calculatedAt(LocalDateTime.now())
                .build();
    }
}
